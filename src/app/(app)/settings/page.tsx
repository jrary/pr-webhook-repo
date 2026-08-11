"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useLogout } from "@/api/queries/auth"
import { useMeQuery, useUpdateMeMutation } from "@/api/queries/user"
import { useMounted } from "@/hooks/use-mounted"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"

function SettingRow({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const mounted = useMounted()
  const [dark, setDark] = useState(false)
  const [reminders, setReminders] = useState(true)

  const { data: me, isPending } = useMeQuery()
  const updateMe = useUpdateMeMutation()
  const logout = useLogout()
  const [nickname, setNickname] = useState("")

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  useEffect(() => {
    setNickname(me?.nickname ?? "")
  }, [me?.nickname])

  function toggleDark(value: boolean) {
    setDark(value)
    document.documentElement.classList.toggle("dark", value)
  }

  function save() {
    const trimmed = nickname.trim()
    if (!trimmed) return
    updateMe.mutate(
      { nickname: trimmed },
      {
        onSuccess: () => toast.success("프로필을 저장했어요"),
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <div>
      <PageHeader title="설정" en="Settings" description="프로필과 앱 환경을 관리하세요" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>프로필</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="text-lg">
                      {nickname.slice(0, 1) || "나"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nickname">이름</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      minLength={2}
                      maxLength={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    {/* the server has no email-change endpoint */}
                    <Input id="email" type="email" value={me?.email ?? ""} disabled />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={save} disabled={updateMe.isPending}>
                    저장
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>환경 설정</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <SettingRow title="다크 모드" description="어두운 테마를 사용합니다">
              <Switch checked={mounted ? dark : false} onCheckedChange={toggleDark} />
            </SettingRow>
            <SettingRow title="리마인더 알림" description="매일 기록 알림을 받습니다">
              <Switch checked={reminders} onCheckedChange={setReminders} />
            </SettingRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>계정</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingRow title="로그아웃" description="이 브라우저에서 로그아웃합니다">
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => {
                  logout()
                  router.replace("/login")
                }}
              >
                로그아웃
              </Button>
            </SettingRow>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
