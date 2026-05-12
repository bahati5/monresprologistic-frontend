import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { isAxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Truck, Globe, Shield } from 'lucide-react'
import { AuthBrandingMark } from '@/components/auth/AuthBrandingMark'
import { getApiErrorMessage } from '@/lib/apiError'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(
        firstName.trim(),
        lastName.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        password,
        passwordConfirmation,
      )
      const u = useAuthStore.getState().user
      navigate(u?.roles?.includes('client') ? '/portal' : '/dashboard')
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 422) {
        const body = err.response.data as { errors?: Record<string, string[]> }
        setErrors(body.errors ?? {})
      } else {
        setErrors({ general: [getApiErrorMessage(err, 'Erreur lors de l\'inscription.')] })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — gradient branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0e7490, #14B8A6)' }}>
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/3" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <AuthBrandingMark />
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
              Rejoignez des milliers<br />d'utilisateurs satisfaits
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-md">
              Creez votre compte gratuitement et commencez a gerer vos expeditions en quelques minutes.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-4"
          >
            {[
              { icon: Truck, text: 'Suivi en temps reel de vos colis' },
              { icon: Globe, text: 'Expeditions Europe vers Afrique' },
              { icon: Shield, text: 'Transactions securisees' },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <feat.icon size={16} />
                </div>
                <span className="text-sm">{feat.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-xl lg:shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary lg:hidden">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Inscription</CardTitle>
              <CardDescription>Creez votre compte Monrespro</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    {errors.general[0]}
                  </motion.div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      placeholder="Jean"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      autoFocus
                      className="h-11"
                    />
                    {errors.first_name && <p className="text-xs text-destructive">{errors.first_name[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      placeholder="Dupont"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-11"
                    />
                    {errors.last_name && <p className="text-xs text-destructive">{errors.last_name[0]}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-11"
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone[0]}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
                    {errors.password && <p className="text-xs text-destructive">{errors.password[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirmer</Label>
                    <Input id="password_confirmation" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required className="h-11" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Inscription...
                    </span>
                  ) : 'Creer mon compte'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Deja un compte ?{' '}
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Se connecter
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
