import { useState } from 'react';
import type { User } from '../api';

type Props = {
  token: string;
  me: User;
  notify: (notice: { tone: 'success' | 'error' | 'info'; text: string }) => void;
  searchQuery: string;
};

type UserFeed = {
  song: string;
  category: string;
  plays: number;
  updated: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  source: 'registered' | 'guest';
  active: boolean;
  feed: UserFeed;
};

const initialUsers: AdminUser[] = [
  { id: 'u_admin_1', name: 'Ayesha Khan', email: 'admin@pulsebeats.io', role: 'admin', source: 'registered', active: true, feed: { song: 'Qalb-e-Mustafaa', category: 'Spiritual', plays: 34, updated: '2h ago' } },
  { id: 'u_1001', name: 'Ali Hassan', email: 'ali.hassan@gmail.com', role: 'user', source: 'registered', active: true, feed: { song: 'Aaj Rung', category: 'Punjabi', plays: 18, updated: '45m ago' } },
  { id: 'u_1002', name: 'Mira Patel', email: 'mira.patel@gmail.com', role: 'user', source: 'registered', active: false, feed: { song: 'Raah-e-Ishq', category: 'Bollywood', plays: 11, updated: '1d ago' } },
  { id: 'u_guest_1', name: 'Guest Session 14', email: 'guest-14@play.local', role: 'guest', source: 'guest', active: true, feed: { song: 'Bulleya', category: 'Sufi', plays: 9, updated: '12m ago' } },
  { id: 'u_guest_2', name: 'Guest Session 22', email: 'guest-22@play.local', role: 'guest', source: 'guest', active: false, feed: { song: 'Bheegi Bheegi', category: 'Indie', plays: 6, updated: '3h ago' } },
  { id: 'u_guest_3', name: 'Guest Session 41', email: 'guest-41@play.local', role: 'guest', source: 'guest', active: true, feed: { song: 'Naina', category: 'Classical Fusion', plays: 14, updated: '20m ago' } },
];

export function UsersPage({ me, searchQuery, notify }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filtered = users.filter((user) => {
    const text = `${user.name} ${user.email} ${user.role} ${user.source} ${user.feed.song} ${user.feed.category}`.toLowerCase();
    return text.includes(searchQuery.trim().toLowerCase());
  });

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  const chartBars = [
    { label: 'Mon', value: 24 },
    { label: 'Tue', value: 38 },
    { label: 'Wed', value: 28 },
    { label: 'Thu', value: 52 },
    { label: 'Fri', value: 64 },
    { label: 'Sat', value: 56 },
    { label: 'Sun', value: 72 },
  ];

  const categoryMix = [
    { label: selectedUser?.feed.category ?? 'Spiritual', percent: 42, color: 'bg-[#c79b5c]' },
    { label: 'Bollywood', percent: 27, color: 'bg-[#a8a0b8]' },
    { label: 'Indie', percent: 18, color: 'bg-[#d9c7a4]' },
    { label: 'Classical', percent: 13, color: 'bg-[#8a7a63]' },
  ];

  const toggleUser = (id: string) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === id ? { ...user, active: !user.active } : user,
      ),
    );
    notify({ tone: 'success', text: 'User access updated.' });
  };

  if (selectedUser) {
    return (
      <section className="space-y-5">
        <div className="rounded-3xl border border-[#d9d0bd] bg-[#f7f2ea] p-5 shadow-[0_12px_28px_rgba(32,25,18,0.04)] sm:p-6">
          <div className="flex flex-col gap-3 border-b border-[#d9d0bd] pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a5312]">User detail</p>
              <h2 className="mt-2 text-2xl font-bold text-[#1f2430]">{selectedUser.name}</h2>
            </div>
            <button
              type="button"
              className="rounded-xl border border-[#d9d0bd] bg-[#f5f1eb] px-3.5 py-2 text-sm font-medium text-[#1f2430] transition hover:bg-[#efe7d8]"
              onClick={() => setSelectedUserId(null)}
            >
              Back to users
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-[#d9d0bd] bg-[#f4efe8] p-4 shadow-[0_10px_20px_rgba(69,54,28,0.04)] sm:p-5">
            <div className="mb-4 flex items-center gap-4 text-sm text-[#1f2430]">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#c8a76e]" /> Order</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#9c8a6f]" /> Revenue</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#7a7d77]" /> Average Order Value</div>
            </div>

            <svg viewBox="0 0 920 260" className="h-[260px] w-full" role="img" aria-label="User analytics chart">
              {[0, 1, 2, 3, 4].map((row) => (
                <line
                  key={row}
                  x1="30"
                  x2="890"
                  y1={30 + row * 45}
                  y2={30 + row * 45}
                  stroke="#d5c9b4"
                  strokeWidth="1"
                />
              ))}

              <path
                d="M30 120 C170 130, 210 100, 270 160 S420 200, 500 150 S670 80, 720 120 S800 100, 890 135 L890 220 L30 220 Z"
                fill="rgba(218, 180, 118, 0.18)"
              />

              <path
                d="M30 150 C170 145, 220 80, 270 120 S440 200, 500 150 S680 100, 720 120 S820 110, 890 110"
                fill="none"
                stroke="#8d6a3d"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M30 160 C160 170, 240 145, 320 170 S480 130, 560 175 S720 150, 890 135"
                fill="none"
                stroke="#3b4d88"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M30 180 C170 205, 260 150, 360 175 S560 190, 660 170 S770 120, 890 145"
                fill="none"
                stroke="#7a7d77"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                const x = 65 + index * 120;
                return (
                  <g key={day}>
                    <text x={x} y="240" textAnchor="middle" fontSize="11" fill="#5f6470">{day}</text>
                  </g>
                );
              })}

              {[0, 50000, 100000, 150000, 200000, 250000].map((value, index) => (
                <g key={value}>
                  <text x="14" y={220 - index * 45} fontSize="10" fill="#6a707a">{value.toLocaleString()}</text>
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[#d9d0bd] bg-[#f5f1eb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6470]">Listening streak</p>
              <p className="mt-3 text-2xl font-bold text-[#1f2430]">{selectedUser.feed.plays + 6}</p>
            </article>
            <article className="rounded-2xl border border-[#d9d0bd] bg-[#f5f1eb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6470]">Categories</p>
              <p className="mt-3 text-2xl font-bold text-[#1f2430]">{selectedUser.feed.category.split(' ').length + 1}</p>
            </article>
            <article className="rounded-2xl border border-[#d9d0bd] bg-[#f5f1eb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6470]">Status</p>
              <p className="mt-3 text-2xl font-bold text-[#1f2430]">{selectedUser.active ? 'Live' : 'Paused'}</p>
            </article>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-[#d9d0bd] bg-[#f3efe9] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6470]">Profile</p>
              <div className="mt-4 space-y-3 text-sm text-[#1f2430]">
                <p><span className="text-[#5f6470]">Full name:</span> {selectedUser.name}</p>
                <p><span className="text-[#5f6470]">Email:</span> {selectedUser.email}</p>
                <p><span className="text-[#5f6470]">Account type:</span> {selectedUser.source === 'guest' ? 'Guest account' : selectedUser.role === 'admin' ? 'Admin' : 'Registered user'}</p>
                <p><span className="text-[#5f6470]">Access:</span> {selectedUser.active ? 'Active' : 'Restricted'}</p>
                <p><span className="text-[#5f6470]">Role:</span> {selectedUser.role}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d9d0bd] bg-[#f3efe9] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6470]">Listening summary</p>
              <div className="mt-4 space-y-3 text-sm text-[#1f2430]">
                <p><span className="text-[#5f6470]">Most played song:</span> {selectedUser.feed.song}</p>
                <p><span className="text-[#5f6470]">Favorite category:</span> {selectedUser.feed.category}</p>
                <p><span className="text-[#5f6470]">Plays:</span> {selectedUser.feed.plays}</p>
                <p><span className="text-[#5f6470]">Last update:</span> {selectedUser.feed.updated}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-[#d9d0bd] bg-[#f3efe9] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6470]">Profile</p>
              <div className="mt-4 space-y-3 text-sm text-[#1f2430]">
                <p><span className="text-[#5f6470]">Full name:</span> {selectedUser.name}</p>
                <p><span className="text-[#5f6470]">Email:</span> {selectedUser.email}</p>
                <p><span className="text-[#5f6470]">Account type:</span> {selectedUser.source === 'guest' ? 'Guest account' : selectedUser.role === 'admin' ? 'Admin' : 'Registered user'}</p>
                <p><span className="text-[#5f6470]">Access:</span> {selectedUser.active ? 'Active' : 'Restricted'}</p>
                <p><span className="text-[#5f6470]">Role:</span> {selectedUser.role}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d9d0bd] bg-[#f3efe9] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6470]">Listening summary</p>
              <div className="mt-4 space-y-3 text-sm text-[#1f2430]">
                <p><span className="text-[#5f6470]">Most played song:</span> {selectedUser.feed.song}</p>
                <p><span className="text-[#5f6470]">Favorite category:</span> {selectedUser.feed.category}</p>
                <p><span className="text-[#5f6470]">Plays:</span> {selectedUser.feed.plays}</p>
                <p><span className="text-[#5f6470]">Last update:</span> {selectedUser.feed.updated}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[#d9d0bd] bg-[#f5f1eb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6470]">Listening streak</p>
              <p className="mt-3 text-2xl font-bold text-[#1f2430]">{selectedUser.feed.plays + 6}</p>
            </article>
            <article className="rounded-2xl border border-[#d9d0bd] bg-[#f5f1eb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6470]">Categories</p>
              <p className="mt-3 text-2xl font-bold text-[#1f2430]">{selectedUser.feed.category.split(' ').length + 1}</p>
            </article>
            <article className="rounded-2xl border border-[#d9d0bd] bg-[#f5f1eb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6470]">Status</p>
              <p className="mt-3 text-2xl font-bold text-[#1f2430]">{selectedUser.active ? 'Live' : 'Paused'}</p>
            </article>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-[#d9d0bd] bg-[#f7f2ea] p-5 shadow-[0_12px_28px_rgba(32,25,18,0.04)]">
          <p className="text-sm font-medium text-[#5f6470]">Total users</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#1f2430]">{users.length}</p>
        </article>
        <article className="rounded-3xl border border-[#d9d0bd] bg-[#f7f2ea] p-5 shadow-[0_12px_28px_rgba(32,25,18,0.04)]">
          <p className="text-sm font-medium text-[#5f6470]">Active</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#1f2430]">{users.filter((u) => u.active).length}</p>
        </article>
        <article className="rounded-3xl border border-[#d9d0bd] bg-[#f7f2ea] p-5 shadow-[0_12px_28px_rgba(32,25,18,0.04)]">
          <p className="text-sm font-medium text-[#5f6470]">Restricted</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#1f2430]">{users.filter((u) => !u.active).length}</p>
        </article>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#d9d0bd] bg-[#f7f2ea] p-5 shadow-[0_12px_28px_rgba(32,25,18,0.04)] sm:p-6">
        <div className="flex items-center justify-between border-b border-[#d9d0bd] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1f2430]">All accounts</h2>
            <p className="mt-1 text-sm text-[#646b75]">{searchQuery ? `Search: “${searchQuery}”` : 'Registered users and guest sessions currently on the platform.'}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filtered.map((user) => (
            <div key={user.id} className="rounded-2xl border border-[#d9d0bd] bg-[#e8e2d9] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1f2430]">{user.name}</span>
                    {user.id === me.id && <span className="rounded-full bg-[#efe7ff] px-2 py-0.5 text-[10px] font-bold text-[#5b3ac4]">YOU</span>}
                    {user.source === 'guest' && <span className="rounded-full border border-[#d9ad4e]/40 bg-[#f7e7b5] px-2 py-0.5 text-[10px] font-bold text-[#7a5312]">GUEST</span>}
                  </div>
                  <p className="text-sm text-[#5f6470]">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#d9d0bd] bg-[#f5f1eb] px-2 py-1 text-xs text-[#303642]">
                    {user.source === 'guest' ? 'Guest account' : user.role === 'admin' ? 'Admin' : 'Registered user'}
                  </span>
                  <button className="rounded-lg border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-1.5 text-xs font-medium text-[#1f2430] transition hover:bg-[#efe7d8]" onClick={() => setSelectedUserId(user.id)}>
                    View details
                  </button>
                  <button className="rounded-lg border border-[#d9d0bd] bg-[#f7f2ea] px-3 py-1.5 text-xs font-medium text-[#1f2430] transition hover:bg-[#efe7d8]" onClick={() => toggleUser(user.id)}>
                    {user.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#d9d0bd] bg-[#f3efe9] p-6 text-center text-sm text-[#636c79]">
              No matching accounts found.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
