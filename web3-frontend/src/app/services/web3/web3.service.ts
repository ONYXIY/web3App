import { Injectable } from '@angular/core';
import { BehaviorSubject, from, of, switchMap, map, catchError } from 'rxjs';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

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

declare global {
  interface Window {
    solana?: any;
    bybitWallet?: any;
  }
}

@Injectable({ providedIn: 'root' })
export class Web3Service {
  private profileSubject = new BehaviorSubject<Web3Profile>({
    address: null,
    isConnected: false,
    walletName: null,
    balance: null
  });
  public profile$ = this.profileSubject.asObservable();

  private detectedWallets: DetectedWallet[] = [];
  private solConnection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  constructor() {
    this.loadFromStorage();
    this.detectWallets();
  }

  private detectWallets() {

    const phantomInstalled = !!window.solana?.isPhantom;
    this.detectedWallets.push({
      name: 'Phantom',
      icon: 'assets/wallets/phantom.svg',
      installed: phantomInstalled,
      connect: () => this.connectPhantom()
    });

    let bybitInstalled = false;
    if (window.bybitWallet?.solana) {
      bybitInstalled = true;
    }
    this.detectedWallets.push({
      name: 'ByBit',
      icon: 'assets/wallets/bybit-wallet.svg',
      installed: bybitInstalled,
      connect: () => this.connectByBit()
    });

    const backpackInstalled = !!window.solana?.isBackpack;
    this.detectedWallets.push({
      name: 'Backpack',
      icon: 'assets/wallets/backpack.svg',
      installed: backpackInstalled,
      connect: () => this.connectBackpack()
    });

    const solflareInstalled = !!window.solana?.isSolflare;
    this.detectedWallets.push({
      name: 'Solflare',
      icon: 'assets/wallets/solflare.svg',
      installed: solflareInstalled,
      connect: () => this.connectSolflare()
    });
  }

  public getAvailableWallets(): DetectedWallet[] {
    return this.detectedWallets;
  }

  private connectPhantom() {
    if (!window.solana?.isPhantom) {
      return of(null);
    }
    return from(window.solana.connect()).pipe(
      switchMap((resp: any) => {
        const address = resp.publicKey?.toString() || null;
        return this.updateProfile({ walletName: 'Phantom', address });
      })
    );
  }

  private connectByBit() {
    if (!window.bybitWallet?.solana) {
      return of(null);
    }
    return from(window.bybitWallet.solana.connect()).pipe(
      switchMap((pk: any) => {
        let address: string | null = null;

        if (typeof pk.publicKey === 'string') {
          address = pk.publicKey;
        } else if (pk.publicKey?.toBase58) {
          address = pk.publicKey.toBase58();
        }
        return this.updateProfile({ walletName: 'ByBit', address });
      })
    );
  }

  private connectBackpack() {
    if (!window.solana?.isBackpack) {
      return of(null);
    }
    return from(window.solana.connect()).pipe(
      switchMap((resp: any) => {
        const address = resp.publicKey?.toString() || null;
        return this.updateProfile({ walletName: 'Backpack', address });
      })
    );
  }

  private connectSolflare() {
    if (!window.solana?.isSolflare) {
      return of(null);
    }
    return from(window.solana.connect()).pipe(
      switchMap(() => {
        const address = window.solana.publicKey?.toString() || null;
        return this.updateProfile({ walletName: 'Solflare', address });
      })
    );
  }

  private updateProfile(params: { walletName: string; address: string | null }) {
    if (!params.address) {
      const empty: Web3Profile = {
        address: null,
        isConnected: false,
        walletName: null,
        balance: null
      };
      this.profileSubject.next(empty);
      this.saveToStorage(empty);
      return of(null);
    }

    return this.getSolBalance(params.address).pipe(
      map((balanceSol: string) => {
        const prev = this.profileSubject.value;
        const updated: Web3Profile = {
          walletName: params.walletName,
          address: params.address,
          isConnected: true,
          balance: balanceSol,
          profileName: prev.profileName || null
        };
        this.profileSubject.next(updated);
        this.saveToStorage(updated);
        return params.address;
      })
    );
  }

  private getSolBalance(address: string) {
    try {
      const pubKey = new PublicKey(address);
      return from(this.solConnection.getBalance(pubKey)).pipe(
        map((lamports: number) => {
          const sol = lamports / 1_000_000_000;
          const solStr = sol.toFixed(4);
          return solStr;
        }),
        catchError(err => {
          console.log('[Web3Service] getSolBalance error:', err);
          return of('0');
        })
      );
    } catch (err) {
      console.log('[Web3Service] Invalid address or error constructing PublicKey:', err);
      return of('0');
    }
  }

  public setProfileName(name: string) {
    const prev = this.profileSubject.value;
    const updated: Web3Profile = {
      ...prev,
      profileName: name
    };
    this.profileSubject.next(updated);
    this.saveToStorage(updated);
  }

  public disconnectWallet() {
    const empty: Web3Profile = {
      address: null,
      isConnected: false,
      walletName: null,
      balance: null,
      profileName: null
    };
    this.profileSubject.next(empty);
    this.saveToStorage(empty);
  }

  private saveToStorage(profile: Web3Profile) {
    localStorage.setItem('web3-profile', JSON.stringify(profile));
  }

  private loadFromStorage() {
    const raw = localStorage.getItem('web3-profile');
    if (!raw) {
      return;
    }
    try {
      const data = JSON.parse(raw) as Web3Profile;
      if (data.address && data.walletName) {
        const restored = {
          ...data,
          isConnected: true
        };
        this.profileSubject.next(restored);
      }
    } catch (err) {
      console.log('[Web3Service] parse error in loadFromStorage:', err);
    }
  }
}
