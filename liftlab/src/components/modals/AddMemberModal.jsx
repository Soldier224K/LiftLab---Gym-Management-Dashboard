"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/appStore";
import { staff } from "@/data/staff";
import { motion } from "framer-motion";
import { UserPlus, Sparkles } from "lucide-react";
const MEMBERSHIP_TYPES = ["Basic", "Pro", "Elite", "Medical-Referral"];
const GENDERS = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const PHOTOS = [
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400",
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=400",
];
const trainers = staff.filter((s) => s.role.includes("Trainer") || s.role === "Manager");
export function AddMemberModal({ open, onOpenChange }) {
    const addMember = useAppStore((s) => s.addMember);
    const membersCount = useAppStore((s) => s.members.length);
    const [form, setForm] = useState({
        name: "",
        email: "",
        contact: "",
        dob: "",
        gender: "Male",
        height_cm: 175,
        weight_kg: 75,
        blood_group: "O+",
        address: "",
        membership_type: "Pro",
        trainer_id: trainers[0]?.id ?? "STF-001",
        emergency_name: "",
        emergency_phone: "",
    });
    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const handleSubmit = () => {
        if (!form.name.trim() || !form.email.trim() || !form.contact.trim()) {
            toast({
                title: "Missing fields",
                description: "Name, email, and contact are required.",
                variant: "destructive",
            });
            return;
        }
        // Default DOB if not provided (18 years ago)
        const dobValue = form.dob || "2000-01-01";
        const idNum = membersCount + 1;
        const id = `MEM-${String(idNum).padStart(3, "0")}`;
        const today = new Date().toISOString().slice(0, 10);
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        const newMember = {
            id,
            photo: PHOTOS[idNum % PHOTOS.length],
            name: form.name.trim(),
            dob: dobValue,
            gender: form.gender,
            height_cm: Number(form.height_cm),
            weight_kg: Number(form.weight_kg),
            blood_group: form.blood_group,
            contact: form.contact,
            email: form.email.trim(),
            emergency_contact: {
                name: form.emergency_name || "N/A",
                relation: "Emergency",
                phone: form.emergency_phone || "N/A",
            },
            address: form.address || "Not specified",
            joining_date: today,
            membership_type: form.membership_type,
            membership_duration_months: 12,
            membership_expiry: expiry.toISOString().slice(0, 10),
            trainer_id: form.trainer_id,
            counsellor_id: "STF-001",
            goals: [
                {
                    goal: "Complete onboarding assessment",
                    target_date: expiry.toISOString().slice(0, 10),
                    status: "In Progress",
                    completion_pct: 0,
                },
            ],
            workout_plan: {
                current_plan_id: `WP-${id}-NEW`,
                plan_name: "Starter Plan",
                assigned_date: today,
                weekly_split: {
                    Monday: { focus: "Full Body A", exercises: [{ name: "Goblet Squat", sets: 3, reps: "10", rest: "90s" }] },
                    Tuesday: { focus: "Active Recovery", exercises: [] },
                    Wednesday: { focus: "Full Body B", exercises: [{ name: "DB Bench Press", sets: 3, reps: "10", rest: "90s" }] },
                    Thursday: { focus: "Rest", exercises: [] },
                    Friday: { focus: "Full Body C", exercises: [{ name: "Romanian Deadlift", sets: 3, reps: "10", rest: "90s" }] },
                    Saturday: { focus: "Light Cardio", exercises: [{ name: "Incline Walk", sets: 1, reps: "20min", rest: "0s" }] },
                    Sunday: { focus: "Rest", exercises: [] },
                },
                history: [
                    { date: today, change: "Initial plan — Starter Plan", changed_by: form.trainer_id },
                ],
            },
            nutrition_plan: {
                provided: false,
                assigned_by: "—",
                daily_calories: 2200,
                macros: { protein_g: 150, carbs_g: 250, fat_g: 70 },
                weekly_plan: {},
                supplements_prescribed: [],
                last_updated: today,
            },
            attendance: {
                total_sessions_scheduled: 0,
                attended: 0,
                absent: 0,
                streak_current: 0,
                monthly_log: {},
            },
            progress_tracker: {
                weight_log: [{ date: today, weight: Number(form.weight_kg) }],
                body_fat_log: [],
                strength_log: { bench_press_1rm: [], squat_1rm: [], deadlift_1rm: [] },
                measurements: { chest_cm: [], waist_cm: [], bicep_cm: [] },
            },
            fees: {
                monthly_fee: form.membership_type === "Elite" ? 6500 : form.membership_type === "Pro" ? 4500 : 3000,
                total_paid: 0,
                total_due: form.membership_type === "Elite" ? 6500 : form.membership_type === "Pro" ? 4500 : 3000,
                status: "Overdue",
                payment_history: [],
            },
            medical: {
                reports: [],
                conditions: form.membership_type === "Medical-Referral" ? ["Pending assessment"] : [],
                allergies: [],
                physician: "—",
                physician_contact: "—",
                clearance_for_training: true,
                notes: "New member — pending full assessment.",
            },
            documents: [
                { name: "Membership Agreement", file: `agreement_${id}.pdf` },
            ],
        };
        addMember(newMember);
        toast({
            title: "Member added ✓",
            description: `${newMember.name} (${id}) added to the directory.`,
        });
        setForm({
            name: "",
            email: "",
            contact: "",
            dob: "",
            gender: "Male",
            height_cm: 175,
            weight_kg: 75,
            blood_group: "O+",
            address: "",
            membership_type: "Pro",
            trainer_id: trainers[0]?.id ?? "STF-001",
            emergency_name: "",
            emergency_phone: "",
        });
        onOpenChange(false);
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong p-0 overflow-hidden max-w-2xl">
        <div className="specular relative">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="h-8 w-8 rounded-lg bg-[var(--primary)]/12 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-[var(--primary)]"/>
              </span>
              Add New Member
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Onboard a new member to LiftLab. They&apos;ll appear in the directory immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 max-h-[60vh] overflow-y-auto ll-scroll space-y-5">
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Personal Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Full Name *">
                  <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Aryan Mehta" className="bg-background/50"/>
                </Field>
                <Field label="Email *">
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="member@email.com" className="bg-background/50"/>
                </Field>
                <Field label="Contact *">
                  <Input value={form.contact} onChange={(e) => update("contact", e.target.value)} placeholder="+91-9876543210" className="bg-background/50"/>
                </Field>
                <Field label="Date of Birth *">
                  <Input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} className="bg-background/50"/>
                </Field>
                <Field label="Gender">
                  <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Blood Group">
                  <Select value={form.blood_group} onValueChange={(v) => update("blood_group", v)}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Height (cm)">
                  <Input type="number" value={form.height_cm} onChange={(e) => update("height_cm", Number(e.target.value))} className="bg-background/50"/>
                </Field>
                <Field label="Weight (kg)">
                  <Input type="number" value={form.weight_kg} onChange={(e) => update("weight_kg", Number(e.target.value))} className="bg-background/50"/>
                </Field>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Membership
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Membership Type">
                  <Select value={form.membership_type} onValueChange={(v) => update("membership_type", v)}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MEMBERSHIP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Assigned Trainer">
                  <Select value={form.trainer_id} onValueChange={(v) => update("trainer_id", v)}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {trainers.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name} · {t.role}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Emergency Contact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Contact Name">
                  <Input value={form.emergency_name} onChange={(e) => update("emergency_name", e.target.value)} placeholder="Emergency contact name" className="bg-background/50"/>
                </Field>
                <Field label="Contact Phone">
                  <Input value={form.emergency_phone} onChange={(e) => update("emergency_phone", e.target.value)} placeholder="+91-9123456789" className="bg-background/50"/>
                </Field>
              </div>
            </section>
          </div>

          <div className="p-6 pt-4 border-t border-border flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]"/>
              Member ID auto-generated · photo auto-assigned
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <motion.div whileTap={{ scale: 0.96 }}>
                <Button onClick={handleSubmit}>
                  <UserPlus className="h-4 w-4 mr-1.5"/> Add Member
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
}
function Field({ label, children }) {
    return (<div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>);
}
