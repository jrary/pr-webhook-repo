"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useSignupMutation } from "@/api/queries/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
  const router = useRouter()
  const signup = useSignupMutation()
  const [nickname, setNickname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    signup.mutate(
      { nickname, email, password },
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
          <h1 className="text-xl font-bold">d-log 시작하기</h1>
          <p className="text-sm text-muted-foreground">계정을 만들고 하루를 기록해보세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>회원가입</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">이름</Label>
                <Input
                  id="nickname"
                  autoComplete="nickname"
                  placeholder="홍길동"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  minLength={2}
                  maxLength={20}
                  required
                />
              </div>
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
                  autoComplete="new-password"
                  placeholder="8자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={20}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={signup.isPending}>
                {signup.isPending ? "가입 중..." : "가입하기"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-medium text-foreground hover:underline">
                로그인
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
