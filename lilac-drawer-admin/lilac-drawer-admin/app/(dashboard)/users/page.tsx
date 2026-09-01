import { getAllUsers, formatDate } from "@/db/queries";
import { getSessionUser } from "@/lib/admin";
import RoleToggle from "@/components/RoleToggle";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const [users, currentUser] = await Promise.all([getAllUsers(), getSessionUser()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl text-purple-deep">Users</h1>
        <p className="text-sm text-tan-dark mt-1">
          {users.length} registered {users.length === 1 ? "account" : "accounts"}.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-tan-dark">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Handle</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 font-medium text-purple-deep">{u.name}</td>
                <td className="px-4 py-3 text-tan-dark">@{u.handle}</td>
                <td className="px-4 py-3 text-tan-dark">{u.email}</td>
                <td className="px-4 py-3 text-tan-dark">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <RoleToggle userId={u.id} role={u.role} isSelf={u.id === currentUser?.id} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-tan-dark">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
