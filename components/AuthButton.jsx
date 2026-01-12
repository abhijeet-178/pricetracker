"use client"

import React, { useState } from "react"
import { Button } from "./ui/button"
import { LogIn, LogOut } from "lucide-react"
import { AuthModel } from "./AuthModel"
import { signOut } from "@/app/action"

const AuthButton = ({ user }) => {
  const [showAuthModel, setShowAuthModel] = useState(false)

  // ✅ USER IS LOGGED IN → SHOW LOGOUT
  if (user) {
    return (
      <form action={signOut}>
        <Button
          variant="ghost"
          size="sm"
          type="submit"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </form>
    )
  }

  // ✅ USER IS NOT LOGGED IN → SHOW SIGN IN
  return (
    <>
      <Button
        onClick={() => setShowAuthModel(true)}
        variant="default"
        size="sm"
        className="bg-orange-500 hover:bg-orange-600 gap-2 cursor-pointer"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </Button>

      <AuthModel
        isOpen={showAuthModel}
        onClose={() => setShowAuthModel(false)}
      />
    </>
  )
}

export default AuthButton
