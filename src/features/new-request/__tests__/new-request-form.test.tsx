import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiError } from '@/api/errors';
import { createRequest } from '@/api/requests';
import { showToast } from '@/lib/toast';

import { NewRequestForm } from '../new-request-form';

jest.mock('@/api/requests', () => ({ createRequest: jest.fn() }));
jest.mock('@/lib/toast', () => ({ showToast: jest.fn() }));
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `00000000-0000-4000-8000-00000000000${++n}`) };
});

const createMock = createRequest as jest.MockedFunction<typeof createRequest>;
const toastMock = showToast as jest.MockedFunction<typeof showToast>;

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

const created = {
  id: 'r1',
  customerName: 'Hôtel Kaloum',
  customerEmail: null,
  customerPhone: '+224 657 33 90 01',
  subject: 'Coupure du service',
  description: 'Depuis 7h ce matin, le système est inaccessible.',
  isPriority: false,
  createdAt: '2026-10-21T09:42:00.000Z',
  updatedAt: '2026-10-21T09:42:00.000Z',
};

async function fillValidForm() {
  await fireEvent.changeText(screen.getByTestId('field-customerName'), created.customerName);
  await fireEvent.changeText(screen.getByTestId('field-customerPhone'), created.customerPhone);
  await fireEvent.changeText(screen.getByTestId('field-subject'), created.subject);
  await fireEvent.changeText(screen.getByTestId('field-description'), created.description);
}

beforeEach(() => {
  createMock.mockReset();
  toastMock.mockReset();
});

it('bloque l’envoi et signale les champs obligatoires (R02)', async () => {
  const onSuccess = jest.fn();
  await render(<NewRequestForm onSuccess={onSuccess} onCancel={jest.fn()} />, { wrapper });

  await fireEvent.press(screen.getByTestId('submit'));

  expect(screen.getByText('Indiquez le nom du client ou de l’entreprise.')).toBeTruthy();
  expect(screen.getByText('Indiquez l’objet de la demande.')).toBeTruthy();
  expect(screen.getByText('Décrivez la demande du client.')).toBeTruthy();
  expect(createMock).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
});

it('échec serveur : saisie conservée, aucun faux succès, réessai avec le même submissionId (R05, R12)', async () => {
  const onSuccess = jest.fn();
  createMock
    .mockRejectedValueOnce(
      new ApiError(503, 'INTERNAL_ERROR', 'La base de données est momentanément indisponible.'),
    )
    .mockResolvedValueOnce(created);

  await render(<NewRequestForm onSuccess={onSuccess} onCancel={jest.fn()} />, { wrapper });
  await fillValidForm();
  await fireEvent.press(screen.getByTestId('submit'));

  expect(await screen.findByText('L’enregistrement a échoué')).toBeTruthy();
  expect(screen.getByText('La base de données est momentanément indisponible.')).toBeTruthy();
  expect(screen.getByTestId('field-customerName').props.value).toBe(created.customerName);
  expect(screen.getByTestId('field-description').props.value).toBe(created.description);
  expect(toastMock).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByTestId('submit'));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(created));

  expect(createMock).toHaveBeenCalledTimes(2);
  const [firstId] = createMock.mock.calls[0];
  const [secondId] = createMock.mock.calls[1];
  expect(secondId).toBe(firstId);
});

it('succès : formulaire vidé, et la demande suivante reçoit un nouveau submissionId', async () => {
  const onSuccess = jest.fn();
  const onDirtyChange = jest.fn();
  createMock.mockResolvedValue(created);

  await render(<NewRequestForm onSuccess={onSuccess} onCancel={jest.fn()} onDirtyChange={onDirtyChange} />, {
    wrapper,
  });
  await fillValidForm();
  await fireEvent.press(screen.getByTestId('submit'));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(created));

  for (const id of ['field-customerName', 'field-customerPhone', 'field-subject', 'field-description']) {
    expect(screen.getByTestId(id).props.value).toBe('');
  }
  expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  expect(screen.queryByTestId('error-banner')).toBeNull();

  await fillValidForm();
  await fireEvent.press(screen.getByTestId('submit'));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(2));
  expect(createMock.mock.calls[1][0]).not.toBe(createMock.mock.calls[0][0]);
});

it('erreurs de validation serveur replacées sous les champs (422)', async () => {
  createMock.mockRejectedValueOnce(
    new ApiError(422, 'VALIDATION_ERROR', 'Vérifiez les champs signalés.', {
      customerName: 'Le nom doit contenir au moins 2 caractères.',
    }),
  );
  await render(<NewRequestForm onSuccess={jest.fn()} onCancel={jest.fn()} />, { wrapper });
  await fillValidForm();
  await fireEvent.press(screen.getByTestId('submit'));

  expect(await screen.findByText('Le nom doit contenir au moins 2 caractères.')).toBeTruthy();
  expect(screen.getByText('Vérifiez les champs signalés.')).toBeTruthy();
  expect(toastMock).not.toHaveBeenCalled();
});
