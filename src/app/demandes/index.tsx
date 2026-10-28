import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { DarkHeader } from '@/components/dark-header';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Fab } from '@/components/fab';
import { ListSkeleton } from '@/components/list-skeleton';
import { OfflineBanner } from '@/components/offline-banner';
import { Pager } from '@/components/pager';
import { RequestCard } from '@/components/request-card';
import { requestKeys, useRequests } from '@/hooks/use-requests';
import { countLabel, initials } from '@/lib/format';
import { colors, fonts, fontSize, motion, size, space } from '@/theme/tokens';
import type { CustomerRequest } from '@/validation/request.schema';

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { state, signOut } = useSession();
  const user = state.status === 'signedIn' ? state.user : null;
  const { fresh } = useLocalSearchParams<{ fresh?: string }>();
  const listRef = useRef<FlatList<CustomerRequest>>(null);
  const [page, setPage] = useState(1);
  const [seenFresh, setSeenFresh] = useState<string>();
  const [expiredFresh, setExpiredFresh] = useState<string>();
  const [pulling, setPulling] = useState(false);

  // Retour d'une création : page 1 et mise en évidence brève de la nouvelle demande.
  if (fresh && fresh !== seenFresh) {
    setSeenFresh(fresh);
    setPage(1);
  }
  const freshId = seenFresh && seenFresh !== expiredFresh ? seenFresh : null;

  useEffect(() => {
    if (!seenFresh) return;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    const t = setTimeout(() => setExpiredFresh(seenFresh), motion.freshHighlightMs);
    return () => clearTimeout(t);
  }, [seenFresh]);

  // Le serveur fait foi : une page hors bornes est recalée sur la dernière page valide,
  // c'est donc toujours `data.page` (et non l'état local) qui pilote la pagination.
  const query = useRequests(page);
  const { data, isPending, isPlaceholderData, isError, isFetching, refetch } = query;

  // Pas de temps réel : rechargement au retour sur l'écran.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      qc.invalidateQueries({ queryKey: requestKeys.lists });
    }, [qc]),
  );

  const onPull = async () => {
    setPulling(true);
    await refetch().finally(() => setPulling(false));
  };

  const goPage = (p: number) => {
    setPage(p);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const openAdd = () => router.push('/demandes/nouvelle');
  const openDetail = useCallback((id: string) => router.push({ pathname: '/demandes/[id]', params: { id } }), []);

  const onUserPress = () => {
    Alert.alert(user?.name ?? 'Équipe Doztra', user?.email, [
      { text: 'Fermer', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  // Quatre états mutuellement exclusifs : chargement, erreur, vide, données.
  const loading = isPending || (isPlaceholderData && isFetching && !isError);
  const error = !loading && isError && (!data || isPlaceholderData);
  const empty = !loading && !error && data?.total === 0;
  const showData = !loading && !error && !!data && data.total > 0;

  return (
    <View style={styles.screen}>
      <DarkHeader
        userInitials={user ? initials(user.name) : 'D'}
        userLabel={user ? `Compte de ${user.name}` : 'Mon compte'}
        onUserPress={onUserPress}
      >
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.title} maxFontSizeMultiplier={1.4}>
            Demandes clients
          </Text>
          <Text style={styles.count}>{data && !error ? countLabel(data.total) : ' '}</Text>
        </View>
      </DarkHeader>

      <FlatList
        ref={listRef}
        data={showData ? data.items : []}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <RequestCard request={item} fresh={item.id === freshId} onOpen={openDetail} />}
        extraData={freshId}
        initialNumToRender={8}
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + size.fab + space.xxl * 2 }]}
        ItemSeparatorComponent={Separator}
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={onPull} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <OfflineBanner />
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Registre des demandes
            </Text>
            <Text style={styles.sectionSub}>Prioritaires d’abord, puis les plus récentes</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ListSkeleton />
          ) : error ? (
            <ErrorState onRetry={() => refetch()} retrying={isFetching} />
          ) : empty ? (
            <EmptyState onAdd={openAdd} />
          ) : undefined
        }
        ListFooterComponent={
          showData ? (
            <View style={styles.footer}>
              <Pager
                page={data.page}
                pages={data.pages}
                pageSize={data.pageSize}
                total={data.total}
                onPrev={() => goPage(data.page - 1)}
                onNext={() => goPage(data.page + 1)}
              />
            </View>
          ) : undefined
        }
      />

      <Fab label="Ajouter une demande" onPress={openAdd} />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  titles: { gap: space.xs },
  title: { fontFamily: fonts.extrabold, fontSize: fontSize.screenTitle, letterSpacing: -0.5, color: colors.onDark },
  count: { fontFamily: fonts.regular, fontSize: fontSize.label, color: colors.onDarkMuted },
  list: { flex: 1 },
  content: { padding: space.gutter, width: '100%', maxWidth: size.maxContentWidth, alignSelf: 'center' },
  listHeader: { gap: 3, paddingBottom: space.md },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: fontSize.sectionTitle, color: colors.text, marginTop: space.xs },
  sectionSub: { fontFamily: fonts.regular, fontSize: fontSize.small, color: colors.textMuted },
  separator: { height: space.sm },
  footer: { paddingTop: space.lg },
});
