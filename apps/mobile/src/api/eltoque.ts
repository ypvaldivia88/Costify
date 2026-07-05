import {
  mapTrmiResponse,
  type ExchangeRateSnapshot,
  type TrmiApiResponse,
} from '@costify/shared/domain/exchange-rates';
import { getEltoqueApiToken } from '@/config/env';

const ELTOQUE_API_URL = 'https://tasas.eltoque.com/v1/trmi';

export async function fetchEltoqueRates(): Promise<ExchangeRateSnapshot> {
  const token = getEltoqueApiToken();
  if (!token) {
    throw new Error('EXPO_PUBLIC_ELTOQUE_API_TOKEN no está configurada.');
  }

  const response = await fetch(ELTOQUE_API_URL, {
    headers: {
      accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`elTOQUE respondió con estado ${response.status}.`);
  }

  const data = (await response.json()) as TrmiApiResponse;
  return mapTrmiResponse(data);
}
