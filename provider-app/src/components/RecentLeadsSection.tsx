import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import AppIcon from './AppIcon';
import StatusBadge from './StatusBadge';

export interface LeadItemData {
  id: string;
  type: 'QUOTE' | 'INQUIRY';
  serviceTitle: string;
  customerName: string;
  eventType: string;
  eventDate?: string;
  location?: string;
  requirementSnippet?: string;
  status: string;
  timeAgo: string;
  imageUrl?: string | null;
}

interface RecentLeadsSectionProps {
  leads: LeadItemData[];
  onViewAllLeads: () => void;
  onSelectLead: (lead: LeadItemData) => void;
  onExploreServices?: () => void;
}

export const RecentLeadsSection: React.FC<RecentLeadsSectionProps> = ({
  leads,
  onViewAllLeads,
  onSelectLead,
  onExploreServices,
}) => {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Leads</Text>
        {leads.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onViewAllLeads}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Leads List or Empty State */}
      {leads.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <AppIcon type="ionicons" name="mail-unread-outline" size={26} color="#E65100" />
          </View>
          <Text style={styles.emptyTitle}>No leads yet</Text>
          <Text style={styles.emptyDesc}>
            Your new celebration enquiries and quote requests will appear here once customers discover your services.
          </Text>
          {onExploreServices && (
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.8}
              onPress={onExploreServices}
            >
              <Text style={styles.exploreBtnText}>Explore Services →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.leadsList}>
          {leads.slice(0, 4).map((lead) => {
            const hasImage = !!lead.imageUrl;
            const metaParts = [lead.eventType, lead.eventDate, lead.location].filter(Boolean);

            return (
              <TouchableOpacity
                key={`${lead.type}_${lead.id}`}
                style={styles.leadCard}
                activeOpacity={0.75}
                onPress={() => onSelectLead(lead)}
              >
                {/* Left: Thumbnail Image or Category Icon */}
                <View style={styles.imageWrap}>
                  {hasImage ? (
                    <Image
                      source={{ uri: lead.imageUrl! }}
                      style={styles.leadImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imageFallback}>
                      <AppIcon
                        type="ionicons"
                        name="sparkles-outline"
                        size={22}
                        color="#E65100"
                      />
                    </View>
                  )}
                </View>

                {/* Center: Details */}
                <View style={styles.detailsCol}>
                  <Text style={styles.serviceTitle} numberOfLines={1}>
                    {lead.serviceTitle}
                  </Text>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {lead.customerName}
                  </Text>

                  {metaParts.length > 0 && (
                    <Text style={styles.metaLine} numberOfLines={1}>
                      {metaParts.join('  •  ')}
                    </Text>
                  )}

                  {!!lead.requirementSnippet && (
                    <Text style={styles.snippetLine} numberOfLines={1}>
                      {lead.requirementSnippet}
                    </Text>
                  )}
                </View>

                {/* Right: Status, Time, Chevron */}
                <View style={styles.rightCol}>
                  <View style={styles.badgeTimeWrap}>
                    <StatusBadge status={lead.status} size="small" />
                    <Text style={styles.timeAgoText}>{lead.timeAgo}</Text>
                  </View>
                  <AppIcon
                    type="ionicons"
                    name="chevron-forward"
                    size={18}
                    color="#A8A29E"
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.2,
  },
  viewAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#881337',
  },
  leadsList: {
    gap: 10,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  imageWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FAF8F5',
  },
  leadImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
  },
  detailsCol: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#57534E',
    marginBottom: 3,
  },
  metaLine: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '500',
    marginBottom: 2,
  },
  snippetLine: {
    fontSize: 11,
    color: '#A8A29E',
    lineHeight: 14,
  },
  rightCol: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 6,
  },
  badgeTimeWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeAgoText: {
    fontSize: 10,
    color: '#A8A29E',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
    maxWidth: 260,
  },
  exploreBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7E0D8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exploreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#881337',
  },
});

export default RecentLeadsSection;
