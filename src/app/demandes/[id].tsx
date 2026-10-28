import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { Button } from '@/components/button';
import { RequestDetail } from '@/features/request-detail/request-detail';
import { requestKeys, useRequest } from '@/hooks/use-requests';
import { NOT_FOUND_MESSAGE } from '@/lib/labels';
import { showToast } from '@/lib/toast';
import { colors, fonts, fontSize, space } from '@/theme/tokens';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, error, isPending, refetch, isFetching } = useRequest(id);
  const notFound = error instanceof ApiError && (error.code === 'NOT_FOUND' || error.code === 'VALIDATION_ERROR');

  useEffect(() => {
    if (!notFound) return;
    showToast(NOT_FOUND_MESSAGE, 'error');
    qc.invalidateQueries({ queryKey: requestKeys.lists });
    router.back();
  }, [notFound, qc]);

  const close = () => router.back();

  if (data) return <RequestDetail request={data} onClose={close} />;

  return (
    <View style={styles.center}>
      {isPending || notFound ? (
        <ActivityIndicator color={colors.primary} accessibilityLabel="Chargement de la demande…" />
      ) : (
        <>
          <Text accessibilityRole="alert" style={styles.title}>
            Impossible de charger la demande
          </Text>
          <Text style={styles.body}>{error?.message ?? 'Vérifiez votre connexion puis réessayez.'}</Text>
          <View style={styles.actions}>
            <Button label="Réessayer" variant="dark" compact busy={isFetching} onPress={() => refetch()} />
            <Button label="Fermer" variant="outline" compact onPress={close} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.xxl,
    backgroundColor: colors.surface,
  },
  title: { fontFamily: fonts.extrabold, fontSize: fontSize.label + 2, color: colors.errorTitle, textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: fontSize.label, color: colors.textMuted, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: space.xs, marginTop: space.xs },
});
