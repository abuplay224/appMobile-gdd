import * as Haptics from 'expo-haptics';
import { router, useNavigation, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';

import { NewRequestForm } from '@/features/new-request/new-request-form';
import { CREATED_TOAST } from '@/lib/labels';

export default function NewRequestScreen() {
  const navigation = useNavigation();
  const [dirty, setDirty] = useState(false);
  const done = useRef(false);

  // Retour matériel / Annuler avec une saisie non vide : confirmation avant de tout perdre.
  usePreventRemove(dirty, ({ data }) => {
    if (done.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert('Abandonner la saisie ?', 'Les informations saisies ne seront pas enregistrées.', [
      { text: 'Continuer la saisie', style: 'cancel' },
      {
        text: 'Abandonner',
        style: 'destructive',
        onPress: () => {
          done.current = true;
          navigation.dispatch(data.action);
        },
      },
    ]);
  });

  return (
    <NewRequestForm
      onDirtyChange={setDirty}
      onCancel={() => router.back()}
      onSuccess={(created) => {
        // Appelé seulement après confirmation du serveur (201 ou 200) ; le formulaire est déjà vidé.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert(CREATED_TOAST, 'L’enregistrement a bien été effectué.', [
          { text: 'Ajouter une autre demande', style: 'cancel' },
          {
            text: 'Retour à la liste',
            onPress: () => {
              done.current = true;
              router.dismissTo({ pathname: '/demandes', params: { fresh: created.id } });
            },
          },
        ]);
      }}
    />
  );
}
