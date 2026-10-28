import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';

import { createRequest } from '@/api/requests';
import { requestKeys } from '@/hooks/use-requests';
import type { RequestFormValues } from '@/validation/request.schema';

/**
 * Création idempotente : `submissionId` est généré à l'ouverture du formulaire et réutilisé
 * à chaque tentative (erreur réseau, 503, délai, double appui). Il n'est renouvelé qu'après
 * un succès, quand le formulaire est vidé pour une nouvelle demande.
 */
export function useCreateRequest() {
  const qc = useQueryClient();
  const [submissionId, setSubmissionId] = useState(() => Crypto.randomUUID());

  const mutation = useMutation({
    mutationFn: (values: RequestFormValues) => createRequest(submissionId, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: requestKeys.lists }),
  });

  /** Nouveau formulaire : nouvel identifiant de soumission. */
  const renewSubmission = useCallback(() => {
    mutation.reset();
    setSubmissionId(Crypto.randomUUID());
  }, [mutation]);

  return { submissionId, mutation, renewSubmission };
}
