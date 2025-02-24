import { Injectable } from '@angular/core';
import { BehaviorSubject, from, of } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  ConfirmedSignatureInfo,
} from '@solana/web3.js';

export interface Web3Profile {
  address: string | null;
  isConnected: boolean;
  walletName: string | null;
  profileName?: string | null;
  balance?: string | null;
}

export interface DetectedWallet {
  name: string;
  icon: string;
  installed: boolean;
  connect: () => any;
}

export interface SolanaTransaction {
  signature: string;
  slot: number;
  blockTime?: number;
  err?: any;
}

declare global {
  interface Window {
    solana?: any;
    bybitWallet?: any;
    ethereum?: any; // ← Добавляем для MetaMask/EVM
  }
}

@Injectable({ providedIn: 'root' })
export class Web3Service {
  private profileSubject = new BehaviorSubject<Web3Profile>({
    address: null,
    isConnected: false,
    walletName: null,
    balance: null,
  });
  public profile$ = this.profileSubject.asObservable();

  private detectedWallets: DetectedWallet[] = [];

  // Подключение к Solana RPC
  private solConnection = new Connection('https://rpc.ankr.com/solana', 'confirmed');
  // private solConnection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  constructor() {
    this.loadFromStorage();
    this.detectWallets();
  }

  private detectWallets() {
    // ---------- Phantom ----------
    const phantomInstalled = !!window.solana?.isPhantom;
    this.detectedWallets.push({
      name: 'Phantom',
      icon: 'assets/wallets/phantom.svg',
      installed: phantomInstalled,
      connect: () => this.connectPhantom(),
    });

    // ---------- Bybit ----------
    let bybitInstalled = false;
    if (window.bybitWallet && typeof window.bybitWallet.solana !== 'undefined') {
      bybitInstalled = true;
      window.bybitWallet.solana.on('connect', () => {
        console.log('%c[Bybit Wallet] connect event', 'color: green');
      });
      window.bybitWallet.solana.on('disconnect', () => {
        console.log('%c[Bybit Wallet] disconnect event', 'color: red');
      });
    }
    this.detectedWallets.push({
      name: 'ByBit',
      icon: 'assets/wallets/bybit-wallet.svg',
      installed: bybitInstalled,
      connect: () => this.connectByBit(),
    });

    // ---------- Backpack ----------
    const backpackInstalled = !!window.solana?.isBackpack;
    this.detectedWallets.push({
      name: 'Backpack',
      icon: 'assets/wallets/backpack.svg',
      installed: backpackInstalled,
      connect: () => this.connectBackpack(),
    });

    // ---------- Solflare ----------
    const solflareInstalled = !!window.solana?.isSolflare;
    this.detectedWallets.push({
      name: 'Solflare',
      icon: 'assets/wallets/solflare.svg',
      installed: solflareInstalled,
      connect: () => this.connectSolflare(),
    });

    // ---------- MetaMask (Ethereum) ----------
    const metaMaskInstalled = !!window.ethereum?.isMetaMask;
    this.detectedWallets.push({
      name: 'MetaMask (Ethereum)',
      icon: 'assets/wallets/metamask.svg',
      installed: metaMaskInstalled,
      connect: () => this.connectMetaMask(),
    });
  }

  // Возвращаем все «обнаруженные» кошельки
  public getAvailableWallets(): DetectedWallet[] {
    return this.detectedWallets;
  }

  // ------------------------------------------------------
  // Подключение MetaMask (Ethereum)
  // ------------------------------------------------------
  private connectMetaMask() {
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      console.warn('[MetaMask] is not installed or not detected!');
      return of(null);
    }
    console.log('[MetaMask] Trying to connect...');

    // ЯВНО указываем, что результат будет string[]
    return from(window.ethereum.request({method: 'eth_requestAccounts'}) as Promise<string[]>).pipe(
      switchMap((accounts: string[]) => {
        if (!accounts || !accounts.length) {
          console.warn('[MetaMask] No accounts found or user cancelled');
          return of(null);
        }
        const address = accounts[0];
        console.log('[MetaMask] Connected account:', address);

        // Далее, если нужно переключиться на Ethereum Mainnet (chainId=0x1)
        // тоже заворачиваем в from(...), чтобы остаться в RxJS-парадигме
        return from(
          window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: '0x1'}],
          }) as Promise<null>
        ).pipe(
          catchError((err) => {
            console.error('[MetaMask] chain switch error:', err);
            // Например, если юзер отменил переключение, просто возвращаем null
            return of(null);
          }),
          // После переключения сети вызываем наш updateProfileEvm(...)
          switchMap(() => {
            return this.updateProfileEvm({
              walletName: 'MetaMask (Ethereum)',
              address,
            });
          })
        );
      })
    );
  }

  // Дополнительный метод для «EVM профиля»
  // (Чтобы не смешивать с Solana логикой getSolBalance)
  private updateProfileEvm(params: { walletName: string; address: string }) {
    const { walletName, address } = params;
    // Допустим, EVM-баланс нам не нужен, оставим "0"
    const evmBalance = '0';
    const prev = this.profileSubject.value;

    const updated: Web3Profile = {
      walletName,
      address,
      isConnected: true,
      balance: evmBalance,
      profileName: prev.profileName || null,
    };

    console.log('[updateProfileEvm]', updated);
    this.profileSubject.next(updated);
    this.saveToStorage(updated);
    return of(address);
  }

  // ------------------------------------------------------
  // Подключение Phantom (Solana)
  // ------------------------------------------------------
  private connectPhantom() {
    if (!window.solana?.isPhantom) {
      console.warn('Phantom not installed!');
      return of(null);
    }
    console.log('[Phantom] Trying connect...');
    return from(window.solana.connect()).pipe(
      tap((resp: any) => {
        console.log('[Phantom] connect() response', resp);
      }),
      switchMap((resp: any) => {
        const address = resp.publicKey?.toString() || null;
        return this.updateProfile({ walletName: 'Phantom', address });
      })
    );
  }

  // ------------------------------------------------------
  // Подключение Bybit (Solana)
  // ------------------------------------------------------
  private connectByBit() {
    if (!window.bybitWallet || typeof window.bybitWallet.solana === 'undefined') {
      console.log('[Bybit] Wallet not installed or no Solana support');
      return of(null);
    }
    console.log('bybitWallet:', window.bybitWallet);
    console.log('bybitWallet.solana:', window.bybitWallet?.solana);
    console.log('bybitWallet.solana.isConnected:', window.bybitWallet?.solana?.isConnected);

    // Если видим chainId='0x1', значит кошелёк на EVM - пользователь должен вручную переключить
    if (window.bybitWallet.chainId === '0x1') {
      console.warn('[Bybit] Chain is EVM (Ethereum). User must switch Bybit to Solana manually!');
      // Если Bybit поддерживает "wallet_switchChain" - можете попробовать:
      /*
      window.bybitWallet.request({
        method: 'wallet_switchChain',
        params: [{ chainId: 'solana' }]
      }).then(...)...
      */
    }

    console.log('[Bybit] Trying connect via window.bybitWallet.solana.connect()...');
    return from(window.bybitWallet.solana.connect()).pipe(
      tap({
        next: (publicKey: any) => {
          console.log('[ByBit] connect result (raw):', publicKey);
        },
        error: (err: any) => {
          console.error('[ByBit] connect error:', err);
        },
      }),
      switchMap((publicKey: any) => {
        let solAddress: string | null = null;

        if (publicKey && typeof publicKey.toBase58 === 'function') {
          // нормальный случай
          solAddress = publicKey.toBase58();
        } else if (publicKey?.publicKey && typeof publicKey.publicKey.toBase58 === 'function') {
          // иногда возвращает объект { publicKey: ... }
          solAddress = publicKey.publicKey.toBase58();
        } else {
          console.warn(
            '[ByBit] The returned object does not have toBase58(). Possibly EVM chain or user cancelled.'
          );
        }

        return this.updateProfile({ walletName: 'ByBit', address: solAddress });
      })
    );
  }

  // ------------------------------------------------------
  // Подключение Backpack (Solana)
  // ------------------------------------------------------
  private connectBackpack() {
    if (!window.solana?.isBackpack) {
      console.warn('Backpack not installed or not detected');
      return of(null);
    }
    console.log('[Backpack] connect...');
    return from(window.solana.connect()).pipe(
      tap((resp: any) => {
        console.log('[Backpack] connect() response', resp);
      }),
      switchMap((resp: any) => {
        const address = resp.publicKey?.toString() || null;
        return this.updateProfile({ walletName: 'Backpack', address });
      })
    );
  }

  // ------------------------------------------------------
  // Подключение Solflare (Solana)
  // ------------------------------------------------------
  private connectSolflare() {
    if (!window.solana?.isSolflare) {
      console.warn('Solflare not installed or not detected');
      return of(null);
    }
    console.log('[Solflare] connect...');
    return from(window.solana.connect()).pipe(
      tap((resp: any) => {
        console.log('[Solflare] connect() response', resp);
      }),
      switchMap(() => {
        const address = window.solana.publicKey?.toString() || null;
        return this.updateProfile({ walletName: 'Solflare', address });
      })
    );
  }

  // ------------------------------------------------------
  // Обновить профиль (Solana) + запрос SOL баланса
  // ------------------------------------------------------
  private updateProfile(params: { walletName: string; address: string | null }) {
    console.log('[updateProfile] params =', params);

    if (!params.address) {
      console.warn('[updateProfile] No address, user might have cancelled or chain mismatch');
      const empty: Web3Profile = {
        address: null,
        isConnected: false,
        walletName: null,
        balance: null,
      };
      this.profileSubject.next(empty);
      this.saveToStorage(empty);
      return of(null);
    }

    // Запрашиваем баланс в SOL
    return this.getSolBalance(params.address).pipe(
      tap((bal) => {
        console.log(`[updateProfile] SOL balance for ${params.address} = ${bal}`);
      }),
      map((balanceSol: string) => {
        const prev = this.profileSubject.value;
        const updated: Web3Profile = {
          walletName: params.walletName,
          address: params.address,
          isConnected: true,
          balance: balanceSol,
          profileName: prev.profileName || null,
        };
        console.log('[updateProfile] Setting new profile =>', updated);
        this.profileSubject.next(updated);
        this.saveToStorage(updated);
        return params.address;
      })
    );
  }

  // Запрос баланса в SOL
  private getSolBalance(address: string) {
    try {
      const pubKey = new PublicKey(address);
      return from(this.solConnection.getBalance(pubKey)).pipe(
        map((lamports: number) => (lamports / 1_000_000_000).toFixed(4)),
        catchError((err) => {
          console.error('[getSolBalance] error:', err);
          return of('0');
        })
      );
    } catch (err) {
      console.error('[getSolBalance] invalid address', address, err);
      return of('0');
    }
  }

  // Установить имя профиля
  public setProfileName(name: string) {
    const prev = this.profileSubject.value;
    const updated: Web3Profile = {
      ...prev,
      profileName: name,
    };
    this.profileSubject.next(updated);
    this.saveToStorage(updated);
  }

  // Отключить кошелёк
  public disconnectWallet() {
    console.log('[disconnectWallet]');
    const empty: Web3Profile = {
      address: null,
      isConnected: false,
      walletName: null,
      balance: null,
      profileName: null,
    };
    this.profileSubject.next(empty);
    this.saveToStorage(empty);
  }

  // Сохранить профиль в localStorage
  private saveToStorage(profile: Web3Profile) {
    localStorage.setItem('web3-profile', JSON.stringify(profile));
  }

  // Загрузить профиль из localStorage
  private loadFromStorage() {
    const raw = localStorage.getItem('web3-profile');
    if (!raw) {
      return;
    }
    try {
      const data = JSON.parse(raw) as Web3Profile;
      if (data.address && data.walletName) {
        this.profileSubject.next({
          ...data,
          isConnected: true,
        });
      }
    } catch {
      // ignore parse errors
    }
  }

  // Загрузка последних транзакций (Solana)
  public getTransactionsForAddress(address: string, limit = 10) {
    try {
      const pubKey = new PublicKey(address);
      return from(this.solConnection.getSignaturesForAddress(pubKey, { limit })).pipe(
        map((signatures: ConfirmedSignatureInfo[]) =>
          signatures.map((sig) => ({
            signature: sig.signature,
            slot: sig.slot,
            blockTime: sig.blockTime ? sig.blockTime * 1000 : undefined,
            err: sig.err,
          }))
        ),
        catchError((err) => {
          console.error('[getTransactionsForAddress] error:', err);
          return of([]);
        })
      );
    } catch (error) {
      console.error('[getTransactionsForAddress]', error);
      return of([]);
    }
  }
}
