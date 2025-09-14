'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Filter, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SkinCard from './skin-card'
import SkinFilters from './skin-filters'
import SkinPagination from './skin-pagination'
import CustomSkinsBreadcrumb from './custom-skins-breadcrumb'
import { CustomSkin, Champion, SkinCategory } from '@/types/custom-skins'

export default function CustomSkinsPage() {
  const [skins, setSkins] = useState<CustomSkin[]>([])
  const [champions, setChampions] = useState<Champion[]>([])
  const [categories, setCategories] = useState<SkinCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  const searchParams = useSearchParams()

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      const championId = searchParams.get('champion')
      const categoryId = searchParams.get('category')
      const search = searchParams.get('search')
      const page = searchParams.get('page') || '1'

      if (championId) params.set('championId', championId)
      if (categoryId) params.set('categoryId', categoryId)
      if (search) params.set('search', search)
      params.set('page', page)
      params.set('limit', '12')

      // Fetch skins
      const skinsResponse = await fetch(`/api/custom-skins?${params}`)
      const skinsData = await skinsResponse.json()

      if (skinsResponse.ok) {
        setSkins(skinsData.skins)
        setPagination(skinsData.pagination)
      }

    } catch (error) {
      console.error('Error fetching skins:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFiltersData = async () => {
    try {
      // Fetch champions and categories for filters
      const [championsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/champions'),
        fetch('/api/skin-categories')
      ])

      if (championsResponse.ok) {
        const championsData = await championsResponse.json()
        setChampions(championsData.champions || [])
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories || [])
      }
    } catch (error) {
      console.error('Error fetching filters data:', error)
      // Set fallback empty arrays on error
      setChampions([])
      setCategories([])
    }
  }

  useEffect(() => {
    fetchFiltersData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [searchParams])

  return (
    <>
      <CustomSkinsBreadcrumb />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20 py-16 sm:py-24">
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Custom{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Skins
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Discover and download amazing custom skins created by the League of Legends community. 
              Transform your champions with unique designs and creative modifications.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/custom-skins/submit">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Your Skin
                </Link>
              </Button>
              <Link href="/custom-skins/gallery">
                <Button variant="outline" size="lg">
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  My Gallery
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container">
          <div className="space-y-6">
            {/* Filters */}
            <SkinFilters 
              champions={champions}
              categories={categories}
            />

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-4 animate-pulse border">
                    <div className="h-48 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : skins.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {skins.map((skin) => (
                    <SkinCard key={skin.id} skin={skin} />
                  ))}
                </div>
                
                {pagination.totalPages > 1 && (
                  <SkinPagination pagination={pagination} />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">
                  No skins found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}