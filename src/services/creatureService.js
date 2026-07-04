/**
 * creatureService.js — Re-export delle funzioni per creature da npcService.js
 * per mantenere separazione logica.
 */
import {
  saveCampaignCreature,
  deleteCampaignCreature,
  subscribeToCampaignCreatures,
  updateCampaignActorHp,
  fetchCreatures as _fetchCreatures,
  deleteCreature as _deleteCreature
} from './npcService';

export const fetchCreatures = _fetchCreatures;
export const deleteCreature = _deleteCreature;
export const saveCreature = saveCampaignCreature;
export const subscribeToCreatures = subscribeToCampaignCreatures;
export const updateCreatureHp = updateCampaignActorHp;
