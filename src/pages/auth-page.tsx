import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

const authFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { login, register } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const authForm = useForm<z.infer<typeof authFormSchema>>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onAuthSubmit(values: z.infer<typeof authFormSchema>) {
    try {
      const result = await (isLogin ? login(values) : register(values));
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        return;
      }
      setLocation('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  async function onForgotPasswordSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

      toast({
        title: "Success",
        description: "If an account exists with this email, you will receive password reset instructions.",
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }

  return (
    <div
      style={{
        backgroundImage: "url('/images/pexels-gantas-1884535.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div className="container max-w-md px-4 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-black mb-3">
            DiveSYNC
          </h1>
          <p className="text-xl text-black">
            Professional Diving Management Platform
          </p>
        </div>

        <Card className="bg-black/80 border-gray-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">
              {isForgotPassword ? "Reset Password" : (isLogin ? "Welcome Back" : "Create Account")}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {isForgotPassword
                ? "Enter your email to receive reset instructions"
                : (isLogin
                  ? "Sign in to access your dashboard"
                  : "Join the DiveSYNC community")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...field}
                            className="bg-white/10 border-gray-600 text-white placeholder:text-gray-400"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Send Reset Instructions
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-gray-300 hover:text-white hover:bg-white/10"
                      onClick={() => setIsForgotPassword(false)}
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <Form {...authForm}>
                <form onSubmit={authForm.handleSubmit(onAuthSubmit)} className="space-y-6">
                  <FormField
                    control={authForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your username"
                            {...field}
                            className="bg-white/10 border-gray-600 text-white placeholder:text-gray-400"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={authForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            {...field}
                            className="bg-white/10 border-gray-600 text-white placeholder:text-gray-400"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      {isLogin ? "Sign In" : "Create Account"}
                    </Button>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-gray-300 hover:text-white hover:bg-white/10"
                        onClick={() => setIsLogin(!isLogin)}
                      >
                        {isLogin ? "Need an account? Register" : "Already have an account? Login"}
                      </Button>
                      {isLogin && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full text-gray-300 hover:text-white hover:bg-white/10"
                          onClick={() => setIsForgotPassword(true)}
                        >
                          Forgot Password?
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}