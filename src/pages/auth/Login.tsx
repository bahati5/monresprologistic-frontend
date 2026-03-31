import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Truck, Globe, Shield } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Les identifiants ne correspondent pas.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — gradient branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2B4C7E)' }}>
        <div className="absolute inset-0">
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-white/3" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                <Package size={24} />
              </div>
              <span className="text-2xl font-bold tracking-tight">Monrespro</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
              Gerez vos expeditions<br />internationales simplement
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-md">
              Plateforme logistique complete pour le suivi de colis, la consolidation et la livraison Europe-Afrique.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-4"
          >
            {[
              { icon: Truck, text: 'Suivi en temps reel de vos expeditions' },
              { icon: Globe, text: 'Couverture Europe vers Afrique' },
              { icon: Shield, text: 'Securite et transparence des transactions' },
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
              <CardTitle className="text-2xl">Connexion</CardTitle>
              <CardDescription>Connectez-vous a votre compte Monrespro</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                      Mot de passe oublie ?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Connexion...
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
                {import.meta.env.DEV && (
                  <p className="text-center text-xs text-muted-foreground px-1">
                    Compte seed : <code className="rounded bg-muted px-1 py-0.5 text-[11px]">admin@monrespro.local</code> / mot de passe{' '}
                    <code className="rounded bg-muted px-1 py-0.5 text-[11px]">password</code>
                    . Si le compte existait deja avant le seed, executer{' '}
                    <code className="text-[11px]">php artisan user:set-password admin@monrespro.local password</code>
                  </p>
                )}
                <p className="text-center text-sm text-muted-foreground">
                  Pas encore de compte ?{' '}
                  <Link to="/register" className="font-medium text-primary hover:underline">
                    S'inscrire
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
