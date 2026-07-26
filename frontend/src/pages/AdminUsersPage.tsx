import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Trash2,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@components/ui/Dialog";
import { useToast } from "@components/ui/Toast";
import {
  fetchAllUsers,
  updateUserRole,
  deleteUser,
  activateUser,
  permanentlyDeleteUser,
  fetchSystemStats,
  type AdminUser,
} from "@services/index";
import { useAuth } from "@hooks/useAuth";
import { ROLE_LABELS } from "@/types/domain";

const ASSIGNABLE_ROLES: AdminUser["role"][] = [
  "principal",
  "hod",
  "faculty",
  "staff",
  "admin",
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingActivateId, setPendingActivateId] = useState<string | null>(
    null,
  );
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [userToPermanentlyDelete, setUserToPermanentlyDelete] =
    useState<AdminUser | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAllUsers,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchSystemStats,
  });

  const roleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: AdminUser["role"];
    }) => updateUserRole(userId, role),
    onMutate: ({ userId }) => setPendingUserId(userId),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      showToast({
        title: "Role updated",
        description: `${updatedUser.fullName} is now ${ROLE_LABELS[updatedUser.role]}.`,
        variant: "success",
      });
    },
    onError: (err) => {
      showToast({
        title: "Couldn't update role",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "error",
      });
    },
    onSettled: () => setPendingUserId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      showToast({
        title: "Account deactivated",
        description:
          "The user's access has been revoked. Their past records remain intact.",
        variant: "success",
      });
      setUserToDelete(null);
    },
    onError: (err) => {
      showToast({
        title: "Couldn't deactivate account",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "error",
      });
      setUserToDelete(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => activateUser(userId),
    onMutate: (userId) => setPendingActivateId(userId),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      showToast({
        title: "Account reactivated",
        description: `${updatedUser.fullName}'s access has been restored.`,
        variant: "success",
      });
    },
    onError: (err) => {
      showToast({
        title: "Couldn't reactivate account",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "error",
      });
    },
    onSettled: () => setPendingActivateId(null),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (userId: string) => permanentlyDeleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      showToast({
        title: "Account permanently deleted",
        description: "The user's identifying information has been erased.",
        variant: "success",
      });
      setUserToPermanentlyDelete(null);
    },
    onError: (err) => {
      showToast({
        title: "Couldn't delete account",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "error",
      });
      setUserToPermanentlyDelete(null);
    },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View registered accounts and manage role assignments.
        </p>
      </div>
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {stats.totalUsers}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total Users
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <UserCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {stats.activeUsers}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <UserX className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {stats.deactivatedUsers}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Deactivated
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {stats.unverifiedUsers}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Unverified</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by Role</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.roleCounts).map(([role, count]) => (
                <Badge key={role} variant="soft" className="gap-1.5">
                  <span className="capitalize">{role}</span>
                  <span className="font-bold">{count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Users</CardTitle>
          <CardDescription>
            {users.length} registered account{users.length !== 1 ? "s" : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading users…
            </p>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2.5 pr-4 font-medium">Name</th>
                    <th className="py-2.5 pr-4 font-medium">Email</th>
                    <th className="py-2.5 pr-4 font-medium">Verified</th>
                    <th className="py-2.5 pr-4 font-medium">Role</th>
                    <th className="py-2.5 pr-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr
                        key={u.id}
                        className={!u.isActive ? "opacity-50" : undefined}
                      >
                        <td className="py-3 pr-4 font-medium">{u.fullName}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="py-3 pr-4">
                          {!u.isActive ? (
                            <Badge
                              variant="soft"
                              className="gap-1 bg-muted text-muted-foreground"
                            >
                              Deactivated
                            </Badge>
                          ) : u.isVerified ? (
                            <Badge
                              variant="soft"
                              className="gap-1 bg-success/10 text-success"
                            >
                              <ShieldCheck
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                              Verified
                            </Badge>
                          ) : (
                            <Badge
                              variant="soft"
                              className="gap-1 bg-destructive/10 text-destructive"
                            >
                              <ShieldAlert
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                              Unverified
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isSelf ? (
                            <span className="text-sm text-muted-foreground">
                              {ROLE_LABELS[u.role]} (you)
                            </span>
                          ) : !u.isActive ? (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              disabled={pendingUserId === u.id}
                              onChange={(e) =>
                                roleMutation.mutate({
                                  userId: u.id,
                                  role: e.target.value as AdminUser["role"],
                                })
                              }
                              className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                            >
                              {ASSIGNABLE_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {!isSelf && u.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUserToDelete(u)}
                              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              Deactivate
                            </Button>
                          )}
                          {!isSelf && !u.isActive && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => activateMutation.mutate(u.id)}
                                isLoading={pendingActivateId === u.id}
                                className="gap-1.5 text-success hover:bg-success/10 hover:text-success"
                              >
                                <UserCheck
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                Reactivate
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserToPermanentlyDelete(u)}
                                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <ShieldX
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                Delete Permanently
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={userToDelete !== null}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate this account?</DialogTitle>
            <DialogDescription>
              {userToDelete && (
                <>
                  This will revoke <strong>{userToDelete.fullName}</strong>'s
                  access to Nirnaya. Their past decisions and uploaded documents
                  will remain on record. You can reactivate this account at any
                  time.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              variant="destructive"
              isLoading={deleteMutation.isPending}
              onClick={() =>
                userToDelete && deleteMutation.mutate(userToDelete.id)
              }
            >
              Deactivate Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={userToPermanentlyDelete !== null}
        onOpenChange={(open) => !open && setUserToPermanentlyDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete this account?</DialogTitle>
            <DialogDescription>
              {userToPermanentlyDelete && (
                <>
                  This will permanently erase{" "}
                  <strong>{userToPermanentlyDelete.fullName}</strong>'s name and
                  email. Their past decisions and uploaded documents will remain
                  on record but will no longer be linked to a real identity.{" "}
                  <strong>This cannot be undone.</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              variant="destructive"
              isLoading={permanentDeleteMutation.isPending}
              onClick={() =>
                userToPermanentlyDelete &&
                permanentDeleteMutation.mutate(userToPermanentlyDelete.id)
              }
            >
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
