import { PlayerStats } from '../entities/CharacterController';
import * as THREE from 'three';

export class HUD {
  private container: HTMLElement;
  private healthFill: HTMLElement;
  private healthVal: HTMLElement;
  private hungerFill: HTMLElement;
  private hungerVal: HTMLElement;
  private thirstFill: HTMLElement;
  private thirstVal: HTMLElement;
  private missionText: HTMLElement;
  private coordsText: HTMLElement;
  private timeText: HTMLElement;
  private interactionPrompt: HTMLElement;
  private interactionLabel: HTMLElement;

  private toastEl: HTMLElement;
  private missionBannerEl: HTMLElement;
  private missionBannerDesc: HTMLElement;
  private toastTimeout: number | null = null;
  private bannerTimeout: number | null = null;

  private currentMission: string = 'Explore the beach.';

  constructor() {
    this.container = document.getElementById('hud-container')!;
    this.healthFill = document.getElementById('health-fill')!;
    this.healthVal = document.getElementById('health-value')!;
    this.hungerFill = document.getElementById('hunger-fill')!;
    this.hungerVal = document.getElementById('hunger-value')!;
    this.thirstFill = document.getElementById('thirst-fill')!;
    this.thirstVal = document.getElementById('thirst-value')!;
    this.missionText = document.getElementById('hud-mission-text')!;
    this.coordsText = document.getElementById('hud-coords')!;
    this.timeText = document.getElementById('hud-time')!;
    this.interactionPrompt = document.getElementById('hud-interaction')!;
    this.interactionLabel = document.getElementById('interaction-text')!;

    this.toastEl = document.getElementById('hud-toast')!;
    this.missionBannerEl = document.getElementById('mission-complete-banner')!;
    this.missionBannerDesc = document.getElementById('mission-complete-desc')!;
  }

  public show(): void {
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  public update(stats: PlayerStats, playerPos: THREE.Vector3, gameTime: number): void {
    // Health bar
    const hPct = Math.round(stats.health);
    this.healthFill.style.width = `${hPct}%`;
    this.healthVal.innerText = `${hPct}%`;

    // Hunger bar
    const huPct = Math.round(stats.hunger);
    this.hungerFill.style.width = `${huPct}%`;
    this.hungerVal.innerText = `${huPct}%`;

    // Thirst bar
    const tPct = Math.round(stats.thirst);
    this.thirstFill.style.width = `${tPct}%`;
    this.thirstVal.innerText = `${tPct}%`;

    // Position coordinates
    const posX = Math.round(playerPos.x);
    const posZ = Math.round(playerPos.z);
    this.coordsText.innerText = `LOC: ${posX}, ${posZ}`;

    // Game time formatting (simulated day cycle)
    const hours = Math.floor((gameTime / 60 + 8) % 24);
    const minutes = Math.floor(gameTime % 60);
    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    this.timeText.innerText = `TIME: ${hh}:${mm}`;
  }

  public setMission(text: string): void {
    this.currentMission = text;
    this.missionText.innerText = text;
  }

  public getMission(): string {
    return this.currentMission;
  }

  public showInteractionPrompt(promptText: string): void {
    this.interactionLabel.innerText = promptText;
    this.interactionPrompt.classList.remove('hidden');
  }

  public hideInteractionPrompt(): void {
    this.interactionPrompt.classList.add('hidden');
  }

  public showToast(msg: string): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastEl.innerText = msg;
    this.toastEl.classList.remove('hidden');
    this.toastTimeout = window.setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, 2800);
  }

  public showMissionComplete(completedTitle: string): void {
    if (this.bannerTimeout) {
      clearTimeout(this.bannerTimeout);
    }
    this.missionBannerDesc.innerText = completedTitle;
    this.missionBannerEl.classList.remove('hidden');
    this.bannerTimeout = window.setTimeout(() => {
      this.missionBannerEl.classList.add('hidden');
    }, 4500);
  }
}
