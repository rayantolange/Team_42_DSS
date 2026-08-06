import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Building2 } from "lucide-react";
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
  fetchAllDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartmentActive,
} from "@services/index";
import type { Department, DepartmentType } from "@/types/domain";

interface DepartmentFormState {
  name: string;
  type: DepartmentType;
  description: string;
}

const EMPTY_FORM: DepartmentFormState = {
  name: "",
  type: "Academic",
  description: "",
};

export default function AdminDepartmentsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentFormState>(EMPTY_FORM);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments", "all"],
    queryFn: fetchAllDepartments,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createDepartment({
        departmentName: form.name,
        departmentType: form.type,
        description: form.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      showToast({ title: "Department created", variant: "success" });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => {
      showToast({
        title: "Couldn't create department",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "error",
      });
    },
  });

  
  const updateMutation = useMutation({
    mutationFn: () =>
      updateDepartment(editingDept!.id, {
        departmentName: form.name,
        departmentType: form.type,
        description: form.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      showToast({ title: "Department updated", variant: "success" });
      setEditingDept(null);
      setForm(EMPTY_FORM);
    },
    onError: (err) => {
      showToast({
        title: "Couldn't update department",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "error",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (departmentId: string) => toggleDepartmentActive(departmentId),
    onSuccess: (updatedDept) => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      showToast({
        title: updatedDept.isActive
          ? "Department activated"
          : "Department deactivated",
        variant: "success",
      });
    },
    onError: (err) => {
      showToast({
        title: "Couldn't update department status",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
        variant: "error",
      });
    },
  });

  function openEdit(dept: Department) {
    setForm({
      name: dept.name,
      type: dept.type,
      description: dept.description,
    });
    setEditingDept(dept);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  }

  const formDialog = (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dept-name" className="text-sm font-medium">
          Department Name
        </label>
        <input
          id="dept-name"
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dept-type" className="text-sm font-medium">
          Type
        </label>
        <select
          id="dept-type"
          value={form.type}
          onChange={(e) =>
            setForm((f) => ({ ...f, type: e.target.value as DepartmentType }))
          }
          className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="Academic">Academic</option>
          <option value="Administrative">Administrative</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dept-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="dept-description"
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          className="rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </>
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Department Management
          </h1>
          <p className="text-muted-foreground">
            Add and edit institutional departments.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Department
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Departments</CardTitle>
          <CardDescription>
            {departments.length} department{departments.length !== 1 ? "s" : ""}
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading departments…
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className={`flex items-start justify-between gap-4 py-4 ${!dept.isActive ? "opacity-50" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{dept.name}</p>
                        <Badge variant="soft">{dept.type}</Badge>
                        {!dept.isActive && (
                          <Badge
                            variant="soft"
                            className="bg-muted text-muted-foreground"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {dept.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={
                        toggleMutation.isPending &&
                        toggleMutation.variables === dept.id
                      }
                      onClick={() => toggleMutation.mutate(dept.id)}
                    >
                      {dept.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(dept)}
                      className="gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Create a new institutional department.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">{formDialog}</div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              isLoading={createMutation.isPending}
              disabled={!form.name.trim()}
              onClick={() => createMutation.mutate()}
            >
              Create Department
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingDept !== null}
        onOpenChange={(open) => !open && setEditingDept(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update this department's details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">{formDialog}</div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              isLoading={updateMutation.isPending}
              disabled={!form.name.trim()}
              onClick={() => updateMutation.mutate()}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
