"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useLoginMutation } from "@/api/queries/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const login = useLoginMutation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    login.mutate(
      { email, password },
      {
        onSuccess: () => router.replace("/"),
        onError: (error) => toast.error(error.message),
      }
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-lg font-bold">d</span>
          </div>
          <h1 className="text-xl font-bold">d-log에 로그인</h1>
          <p className="text-sm text-muted-foreground">하루를 기록하는 가장 간단한 방법</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? "로그인 중..." : "로그인"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="font-medium text-foreground hover:underline">
                회원가입
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
