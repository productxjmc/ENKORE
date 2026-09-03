import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Users } from "lucide-react";

export type LocationFollow = { location: string | null; source: string };

// Ported from the Base44 app's src/components/qr/LocationMap.jsx —
// purely presentational, grouping follows by location where
// source === LIVE_EVENT_QR (this rebuild's FollowSource enum member;
// source used 'live_event_qr' lowercase). Takes the `follows` array the
// dashboard shell already fetches for RecentActivity (src/app/dashboard/
// page.tsx) rather than issuing a second query for the same table.
export default function LocationMap({ follows }: { follows: LocationFollow[] }) {
  const locationGroups = follows
    .filter((f): f is LocationFollow & { location: string } => Boolean(f.location) && f.source === "LIVE_EVENT_QR")
    .reduce<Record<string, { location: string; count: number }>>((acc, follow) => {
      const loc = follow.location;
      if (!acc[loc]) acc[loc] = { location: loc, count: 0 };
      acc[loc].count++;
      return acc;
    }, {});

  const sortedLocations = Object.values(locationGroups).sort((a, b) => b.count - a.count);
  const totalEventFollows = sortedLocations.reduce((sum, loc) => sum + loc.count, 0);

  if (sortedLocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Fan Location Map
          </CardTitle>
          <CardDescription>Track where your fans are connecting from live events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No event connections yet</p>
            <p className="text-sm text-gray-400 mt-1">Generate a QR code for your next event to start tracking</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          Fan Location Map
        </CardTitle>
        <CardDescription>{totalEventFollows} fans connected via live events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedLocations.map((loc) => {
            const percentage = (loc.count / totalEventFollows) * 100;
            return (
              <div key={loc.location} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{loc.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{loc.count}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
