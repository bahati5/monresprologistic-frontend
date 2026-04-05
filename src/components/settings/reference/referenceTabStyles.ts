/**
 * Styles onglets inspirés de OrganisationSettingsPage (my-ez-frontend) :
 * grille responsive, fond carte, onglet actif = couleur primaire du thème.
 */
export const referenceTabsList =
  'grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-1 mb-6 bg-card p-1 rounded-xl shadow-sm border border-border'

export const referenceTabsTrigger =
  'flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs sm:text-sm font-medium transition-colors ' +
  'text-muted-foreground hover:text-foreground ' +
  'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm'

export const referenceTabsContent = 'mt-0 space-y-6 focus-visible:outline-none'
