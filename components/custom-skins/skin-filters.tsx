'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Champion, SkinCategory } from '@/types/custom-skins'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X, ChevronDown } from 'lucide-react'

interface SkinFiltersProps {
  champions: Champion[]
  categories: SkinCategory[]
}

export default function SkinFilters({ champions = [], categories = [] }: SkinFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedChampion, setSelectedChampion] = useState(searchParams.get('champion') || 'all')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [championSearchQuery, setChampionSearchQuery] = useState('')
  const [showChampionDropdown, setShowChampionDropdown] = useState(false)

  // Filter champions based on search query
  const filteredChampions = champions.filter(champion => {
    const query = championSearchQuery?.toLowerCase() || ''
    const name = champion?.name?.toLowerCase() || ''
    const alias = champion?.alias?.toLowerCase() || ''
    return name.includes(query) || alias.includes(query)
  })

  const getSelectedChampionName = (championId: string) => {
    if (championId === 'all') return 'All Champions'
    const champion = champions.find(c => c?.id?.toString() === championId)
    return champion ? `${champion.name || ''} (${champion.skinCount || 0})` : 'All Champions'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (target && !target.closest('.champion-filter-selector')) {
        setShowChampionDropdown(false)
      }
    }

    if (showChampionDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showChampionDropdown])

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    if (search.trim()) params.set('search', search.trim())
    if (selectedChampion && selectedChampion !== 'all') params.set('champion', selectedChampion)
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory)
    
    router.push(`/custom-skins?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedChampion('all')
    setSelectedCategory('all')
    router.push('/custom-skins')
  }

  const hasFilters = search || (selectedChampion && selectedChampion !== 'all') || (selectedCategory && selectedCategory !== 'all')

  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search skins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            className="pl-10"
          />
        </div>

        {/* Champion Filter */}
        <div className="relative champion-filter-selector">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Input
              placeholder="Search champions..."
              value={selectedChampion === 'all' ? championSearchQuery : getSelectedChampionName(selectedChampion)}
              onChange={(e) => {
                const value = e.target.value || ''
                setChampionSearchQuery(value)
                if (selectedChampion !== 'all') {
                  setSelectedChampion('all')
                }
                setShowChampionDropdown(true)
              }}
              onFocus={() => setShowChampionDropdown(true)}
              className="pl-10 pr-10 cursor-pointer"
            />
            <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-transform ${showChampionDropdown ? 'rotate-180' : ''}`} />
          </div>
          {showChampionDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
              {/* All Champions option */}
              <div
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
                onClick={() => {
                  setSelectedChampion('all')
                  setChampionSearchQuery('')
                  setShowChampionDropdown(false)
                }}
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">All Champions</span>
              </div>
              
              {filteredChampions.length > 0 ? (
                filteredChampions.map((champion) => (
                  <div
                    key={champion?.id || Math.random()}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    onClick={() => {
                      setSelectedChampion(champion?.id?.toString() || '')
                      setChampionSearchQuery('')
                      setShowChampionDropdown(false)
                    }}
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100">{champion?.name || 'Unknown'}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{champion?.skinCount || 0} skins</span>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                  {championSearchQuery ? 'No champions found matching your search' : 'No champions available'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Array.isArray(categories) && categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name} ({category.skinCount || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Apply Button */}
        <Button onClick={applyFilters}>
          <Search className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-4">
          {search && (
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1">
              Search: "{search}"
            </div>
          )}
          {selectedChampion && selectedChampion !== 'all' && Array.isArray(champions) && (
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              Champion: {champions.find(c => c.id.toString() === selectedChampion)?.name}
            </div>
          )}
          {selectedCategory && selectedCategory !== 'all' && Array.isArray(categories) && (
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              Category: {categories.find(c => c.id === selectedCategory)?.name}
            </div>
          )}
        </div>
      )}
    </div>
  )
}