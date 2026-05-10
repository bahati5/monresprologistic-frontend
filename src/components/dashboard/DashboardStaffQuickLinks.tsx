import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FileText, Plus, Truck, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { fadeInUp } from '@/lib/animations'

export function DashboardStaffQuickLinks() {
  return (
    <motion.div variants={fadeInUp}>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/shipments/create"><Plus size={14} className="mr-1.5" /> Nouvelle expedition</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/clients"><Users size={14} className="mr-1.5" /> Annuaire clients</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/finance/invoices"><FileText size={14} className="mr-1.5" /> Facturation</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/pickups"><Truck size={14} className="mr-1.5" /> Pickups</Link>
        </Button>
      </div>
    </motion.div>
  )
}
