"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"

type UserFormValues = {
  name: string
  email: string
  role: string
  plan: string
  billing: string
  status: string
}

interface UserFormDialogProps {
  onAddUser: (user: UserFormValues) => void
}

// i18n-ignore: valores de enum idênticos aos dados brutos em data.json (dado, não é UI)
const ROLE_OPTIONS = ["Admin", "Author", "Editor", "Maintainer", "Subscriber"] as const
// i18n-ignore: valores de enum idênticos aos dados brutos em data.json (dado, não é UI)
const PLAN_OPTIONS = ["Basic", "Professional", "Enterprise"] as const
// i18n-ignore: valores de enum idênticos aos dados brutos em data.json (dado, não é UI)
const BILLING_OPTIONS = ["Auto Debit", "UPI", "Paypal"] as const
// i18n-ignore: valores de enum idênticos aos dados brutos em data.json (dado, não é UI)
const STATUS_OPTIONS = ["Active", "Pending", "Error", "Inactive"] as const

export function UserFormDialog({ onAddUser }: UserFormDialogProps) {
  const t = useTranslations("users.form")
  const [open, setOpen] = useState(false)

  // Defined inside the component so zod messages can be localized via t().
  const userFormSchema = z.object({
    name: z.string().min(2, {
      message: t("nameMinLength"),
    }),
    email: z.string().email({
      message: t("emailInvalid"),
    }),
    role: z.string().min(1, {
      message: t("roleRequired"),
    }),
    plan: z.string().min(1, {
      message: t("planRequired"),
    }),
    billing: z.string().min(1, {
      message: t("billingRequired"),
    }),
    status: z.string().min(1, {
      message: t("statusRequired"),
    }),
  })

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      plan: "",
      billing: "",
      status: "",
    },
  })

  function onSubmit(data: UserFormValues) {
    onAddUser(data)
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          {t("addNewUser")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("addNewUser")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("emailPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("role")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder={t("rolePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("plan")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder={t("planPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLAN_OPTIONS.map((plan) => (
                          <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("billing")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder={t("billingPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BILLING_OPTIONS.map((billing) => (
                          <SelectItem key={billing} value={billing}>{billing}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder={t("statusPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="cursor-pointer">
                {t("saveUser")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
