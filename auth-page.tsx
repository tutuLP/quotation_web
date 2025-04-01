"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import * as ToggleGroup from "@radix-ui/react-toggle-group"
import { useToast } from "@/hooks/use-toast"
import axios from "@/lib/axios"
import { useRouter } from "next/navigation"

type FormType = "login" | "register" | "forgot-password"

interface LoginResponse {
  success: boolean
  message: string | null
  data: {
    token: string
    userId: string
    username: string
  } | null
  code: number
}

interface VerificationResponse {
  success: boolean
  message: string | null
  data: string
  code: number
}

interface RegisterResponse {
  success: boolean
  message: string | null
  data: string
  code: number
}

interface ResetPasswordResponse {
  success: boolean
  message: string | null
  data: {
    username: string
    password: string
  }
  code: number
}

export default function AuthPage() {
  const [formType, setFormType] = useState<FormType>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [style, setStyle] = useState<"0" | "1">("0") // 0 表示门店端，1 表示工厂端
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { toast } = useToast()
  const router = useRouter()

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 发送验证码
  const handleSendVerificationCode = async (email: string) => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "发送失败",
        description: "请输入邮箱地址",
        duration: 3000,
      })
      return
    }

    try {
      setSendingCode(true)
      
      // 根据表单类型选择不同的API路径
      const apiPath = formType === "forgot-password" 
        ? '/api/user/reset-password-code' 
        : '/api/user/verification-code'
      
      // 打印请求参数
      console.log('发送验证码请求参数:', { email })
      
      const response = await axios.post<VerificationResponse>(apiPath, { email })
      
      // 打印响应数据
      console.log('发送验证码响应数据:', response.data)

      if (response.data.code === 200) {
        toast({
          title: "发送成功",
          description: "验证码已发送到您的邮箱",
          duration: 3000,
        })
        setCountdown(60) // 设置60秒倒计时
      } else {
        toast({
          variant: "destructive",
          title: "发送失败",
          description: response.data.message || "验证码发送失败",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('发送验证码错误:', error)
      toast({
        variant: "destructive",
        title: "发送失败",
        description: "验证码发送失败，请稍后重试",
        duration: 3000,
      })
    } finally {
      setSendingCode(false)
    }
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    if (formType === "register") {
      try {
        setLoading(true)
        const password = formData.get('reg-password')
        const confirmPassword = formData.get('confirm-password')
        
        if (password !== confirmPassword) {
          toast({
            variant: "destructive",
            title: "注册失败",
            description: "两次输入的密码不一致",
            duration: 3000,
          })
          return
        }
        
        const requestData = {
          username: formData.get('reg-username'),
          password: password,
          email: formData.get('reg-email'),
          verificationCode: formData.get('verification-code'),
          style: style
        }
        
        // 打印请求参数
        console.log('注册请求参数:', requestData)
        
        const response = await axios.post<RegisterResponse>('/api/user/sign', requestData)
        
        // 打印响应数据
        console.log('注册响应数据:', response.data)

        if (response.data.code === 200) {
          toast({
            title: "注册成功",
            description: "请使用新账号登录",
            duration: 3000,
          })
          setFormType("login")
        } else {
          toast({
            variant: "destructive",
            title: "注册失败",
            description: response.data.message || "注册失败，请重试",
            duration: 3000,
          })
        }
      } catch (error) {
        console.error('注册请求错误:', error)
        toast({
          variant: "destructive",
          title: "注册失败",
          description: "注册失败，请重试",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    } else if (formType === "forgot-password") {
      try {
        setLoading(true)
        const requestData = {
          email: formData.get('reset-email'),
          verificationCode: formData.get('reset-code'),
          newPassword: formData.get('new-password'),
          style: style
        }
        
        // 打印请求参数
        console.log('重置密码请求参数:', requestData)
        
        const response = await axios.post<ResetPasswordResponse>('/api/user/reset-password', requestData)
        
        // 打印响应数据
        console.log('重置密码响应数据:', response.data)

        if (response.data.code === 200) {
          toast({
            title: "密码重置成功",
            description: `用户名: ${response.data.data.username}\n密码: ${response.data.data.password}`,
            duration: 5000,
          })
          setFormType("login")
        } else {
          toast({
            variant: "destructive",
            title: "重置失败",
            description: "验证码错误",
            duration: 3000,
          })
        }
      } catch (error) {
        console.error('重置密码请求错误:', error)
        toast({
          variant: "destructive",
          title: "重置失败",
          description: "重置失败，请重试",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    } else {
      // 登录处理
      try {
        setLoading(true)
        const requestData = {
          username: formData.get('username'),
          password: formData.get('password'),
          style: style
        }
        
        // 打印请求参数
        console.log('登录请求参数:', requestData)
        
        const response = await axios.post<LoginResponse>('/api/user', requestData)
        
        // 打印响应数据
        console.log('登录响应数据:', response.data)

        if (response.data.code === 200) {
          // 存储 token 和 userId
          localStorage.setItem('token', response.data.data!.token)
          localStorage.setItem('userId', response.data.data!.userId)
          
          // 设置 axios 默认 headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data!.token}`
          
          // 显示成功提示
          toast({
            title: "登录成功",
            description: "欢迎回来！",
            duration: 3000, // 显示3秒
          })
          
          // 延迟跳转，让用户看到提示
          setTimeout(() => {
            router.push('/home')
          }, 1000)
        } else if (response.data.code === 500) {
          // 显示错误提示
          toast({
            variant: "destructive",
            title: "登录失败",
            description: "账号或密码错误",
            duration: 3000,
          })
        } else {
          // 显示其他错误提示
          toast({
            variant: "destructive",
            title: "登录失败",
            description: response.data.message || "未知错误",
            duration: 3000,
          })
        }
      } catch (error) {
        // 打印错误信息
        console.error('登录请求错误:', error)
        
        // 显示错误提示
        toast({
          variant: "destructive",
          title: "登录失败",
          description: "用户名或密码错误",
          duration: 3000,
        })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 bg-cover bg-center" style={{ backgroundImage: 'url(/back1.jpg)' }}>
      <div className="absolute top-4 left-4">
        <img src="/log1.png" alt="Logo" className="h-12" />
      </div>
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {formType === "login" && "用户登录"}
            {formType === "register" && "用户注册"}
            {formType === "forgot-password" && "找回密码"}
          </CardTitle>
          <CardDescription className="text-center">
            {formType === "login" && "请输入您的账号和密码"}
            {formType === "register" && "创建一个新账号"}
            {formType === "forgot-password" && "重置您的密码"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* 登录表单 */}
            {formType === "login" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">账号</Label>
                  <Input name="username" id="username" placeholder="请输入账号" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <div className="relative">
                    <Input name="password" id="password" type={showPassword ? "text" : "password"} placeholder="请输入密码" required />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showPassword ? "隐藏密码" : "显示密码"}</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>选择登录端口</Label>
                  <ToggleGroup.Root
                    className="flex w-full rounded-lg border p-1 gap-1"
                    type="single"
                    value={style}
                    onValueChange={(value) => value && setStyle(value as "0" | "1")}
                  >
                    <ToggleGroup.Item
                      value="0"
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                        style === "0"
                          ? "bg-blue-600 text-white"
                          : "bg-transparent hover:bg-gray-100"
                      }`}
                    >
                      门店端
                    </ToggleGroup.Item>
                    <ToggleGroup.Item
                      value="1"
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                        style === "1"
                          ? "bg-blue-600 text-white"
                          : "bg-transparent hover:bg-gray-100"
                      }`}
                    >
                      工厂端
                    </ToggleGroup.Item>
                  </ToggleGroup.Root>
                </div>
              </>
            )}

            {/* 注册表单 */}
            {formType === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reg-username">用户名</Label>
                  <Input name="reg-username" id="reg-username" placeholder="请输入用户名" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">邮箱</Label>
                  <Input name="reg-email" id="reg-email" type="email" placeholder="请输入邮箱" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">密码</Label>
                  <div className="relative">
                    <Input
                      name="reg-password"
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="请输入密码"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showPassword ? "隐藏密码" : "显示密码"}</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <div className="relative">
                    <Input
                      name="confirm-password"
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="请再次输入密码"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showConfirmPassword ? "隐藏密码" : "显示密码"}</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>选择注册端口</Label>
                  <ToggleGroup.Root
                    className="flex w-full rounded-lg border p-1 gap-1"
                    type="single"
                    value={style}
                    onValueChange={(value) => value && setStyle(value as "0" | "1")}
                  >
                    <ToggleGroup.Item
                      value="0"
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                        style === "0"
                          ? "bg-blue-600 text-white"
                          : "bg-transparent hover:bg-gray-100"
                      }`}
                    >
                      门店端
                    </ToggleGroup.Item>
                    <ToggleGroup.Item
                      value="1"
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                        style === "1"
                          ? "bg-blue-600 text-white"
                          : "bg-transparent hover:bg-gray-100"
                      }`}
                    >
                      工厂端
                    </ToggleGroup.Item>
                  </ToggleGroup.Root>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label htmlFor="verification-code">验证码</Label>
                    <Input name="verification-code" id="verification-code" placeholder="请输入验证码" required />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-10"
                      disabled={sendingCode || countdown > 0}
                      onClick={() => {
                        const email = (document.getElementById('reg-email') as HTMLInputElement)?.value
                        handleSendVerificationCode(email)
                      }}
                    >
                      {sendingCode ? "发送中..." : countdown > 0 ? `${countdown}秒后重试` : "获取验证码"}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* 忘记密码表单 */}
            {formType === "forgot-password" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">邮箱</Label>
                  <Input name="reset-email" id="reset-email" type="email" placeholder="请输入邮箱" required />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label htmlFor="reset-code">验证码</Label>
                    <Input name="reset-code" id="reset-code" placeholder="请输入验证码" required />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-10"
                      disabled={sendingCode || countdown > 0}
                      onClick={() => {
                        const email = (document.getElementById('reset-email') as HTMLInputElement)?.value
                        handleSendVerificationCode(email)
                      }}
                    >
                      {sendingCode ? "发送中..." : countdown > 0 ? `${countdown}秒后重试` : "获取验证码"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <div className="relative">
                    <Input
                      name="new-password"
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="请输入新密码"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showPassword ? "隐藏密码" : "显示密码"}</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>选择端口</Label>
                  <ToggleGroup.Root
                    className="flex w-full rounded-lg border p-1 gap-1"
                    type="single"
                    value={style}
                    onValueChange={(value) => value && setStyle(value as "0" | "1")}
                  >
                    <ToggleGroup.Item
                      value="0"
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                        style === "0"
                          ? "bg-blue-600 text-white"
                          : "bg-transparent hover:bg-gray-100"
                      }`}
                    >
                      门店端
                    </ToggleGroup.Item>
                    <ToggleGroup.Item
                      value="1"
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                        style === "1"
                          ? "bg-blue-600 text-white"
                          : "bg-transparent hover:bg-gray-100"
                      }`}
                    >
                      工厂端
                    </ToggleGroup.Item>
                  </ToggleGroup.Root>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={((formType === "login" || formType === "forgot-password") && !style) || loading}
            >
              {loading ? "登录中..." : (
                <>
                  {formType === "login" && "登录"}
                  {formType === "register" && "注册"}
                  {formType === "forgot-password" && "重置密码"}
                </>
              )}
            </Button>

            {formType === "login" && (
              <div className="flex justify-between w-full text-sm">
                <Button type="button" variant="link" className="px-0 text-blue-600 hover:text-blue-700" onClick={() => setFormType("register")}>
                  注册账号
                </Button>
                <Button type="button" variant="link" className="px-0 text-blue-600 hover:text-blue-700" onClick={() => setFormType("forgot-password")}>
                  忘记密码
                </Button>
              </div>
            )}

            {(formType === "register" || formType === "forgot-password") && (
              <Button type="button" variant="link" className="w-full" onClick={() => setFormType("login")}>
                返回登录
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

