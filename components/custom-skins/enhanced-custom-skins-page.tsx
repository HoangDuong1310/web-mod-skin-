'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { SkinQuickViewModal } from './skin-quick-view-modal'
import { 
  Search, 
  Filter, 
  Download, 
  Users, 
  Package,
  Sparkles,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Grid3x3,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  Gamepad2,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn, getChampionIconUrl } from '@/lib/utils'
import { EnhancedSkinCard } from './enhanced-skin-card'
import { motion as m } from 'framer-motion'

interface EnhancedCustomSkinsPageProps {
  initialData: {
    featuredSkins: any[]
    recentSkins: any[]
    popularSkins: any[]
    categories: any[]
    champions: any[]
    statistics: {
      totalSkins: number
      totalDownloads: number
      totalAuthors: number
    }
  }
}

export function EnhancedCustomSkinsPage({ initialData }: EnhancedCustomSkinsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedChampion, setSelectedChampion] = useState<string>('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [skins, setSkins] = useState<any[]>([])
  const [selectedSkin, setSelectedSkin] = useState<any>(null)
  const [showQuickView, setShowQuickView] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleQuickView = (skin: any) => {
    setSelectedSkin(skin)
    setShowQuickView(true)
  }

  // Stats animation
  const [displayStats, setDisplayStats] = useState({
    skins: 0,
    downloads: 0,
    authors: 0
  })

  useEffect(() => {
    // Animate stats counting
    const duration = 2000
    const steps = 60
    const interval = duration / steps

    const incrementSkins = initialData.statistics.totalSkins / steps
    const incrementDownloads = initialData.statistics.totalDownloads / steps
    const incrementAuthors = initialData.statistics.totalAuthors / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      setDisplayStats({
        skins: Math.min(Math.round(incrementSkins * currentStep), initialData.statistics.totalSkins),
        downloads: Math.min(Math.round(incrementDownloads * currentStep), initialData.statistics.totalDownloads),
        authors: Math.min(Math.round(incrementAuthors * currentStep), initialData.statistics.totalAuthors)
      })

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [initialData.statistics])

  // Filter skins based on current tab and filters
  useEffect(() => {
    let filtered = []
    
    switch (activeTab) {
      case 'featured':
        filtered = initialData.featuredSkins
        break
      case 'recent':
        filtered = initialData.recentSkins
        break
      case 'popular':
        filtered = initialData.popularSkins
        break
      default: {
        // Combine and deduplicate by ID
        const combined = [...initialData.recentSkins, ...initialData.popularSkins]
        const uniqueMap = new Map()
        combined.forEach(skin => {
          if (!uniqueMap.has(skin.id)) {
            uniqueMap.set(skin.id, skin)
          }
        })
        filtered = Array.from(uniqueMap.values())
        break
      }
    }

    // Apply filters
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(skin => skin.category?.id === selectedCategory)
    }

    if (selectedChampion !== 'all') {
      filtered = filtered.filter(skin => skin.champion?.id === parseInt(selectedChampion))
    }

    if (searchQuery) {
      filtered = filtered.filter(skin => 
        skin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skin.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skin.champion?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloadCount - a.downloadCount)
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    setSkins(filtered)
  }, [activeTab, selectedCategory, selectedChampion, searchQuery, sortBy, initialData])

  const stats = [
    { 
      icon: Package, 
      label: 'Total Skins', 
      value: displayStats.skins.toLocaleString(),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    { 
      icon: Download, 
      label: 'Downloads', 
      value: displayStats.downloads.toLocaleString(),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    { 
      icon: Users, 
      label: 'Creators', 
      value: displayStats.authors.toLocaleString(),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 py-12 lg:py-20 relative z-10"
        >
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Cộng đồng Modding lớn nhất Việt Nam</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              Custom Skins Collection
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Khám phá hàng nghìn custom skins độc đáo, sáng tạo cho League of Legends. 
              Biến hóa vẻ ngoài tướng yêu thích của bạn ngay hôm nay!
            </motion.p>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm kiếm skin theo tên, tướng hoặc mô tả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base rounded-full border-2 focus:border-primary/50 transition-all"
                />
                <Button
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                  onClick={() => searchInputRef.current?.focus()}
                >
                  Tìm kiếm
                </Button>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3 justify-center"
            >
              <Link href="/custom-skins/submit">
                <Button variant="outline" className="rounded-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit Skin
                </Button>
              </Link>
              <Link href="/custom-skins/gallery">
                <Button variant="outline" className="rounded-full">
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Gallery View
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Statistics */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mt-12"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Card className="border-2 hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid grid-cols-4 w-full lg:w-auto">
              <TabsTrigger value="all" className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Tất cả</span>
              </TabsTrigger>
              <TabsTrigger value="featured" className="gap-2">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Nổi bật</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Mới nhất</span>
              </TabsTrigger>
              <TabsTrigger value="popular" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Phổ biến</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filter Controls */}
          <div className="flex gap-2">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="popular">Phổ biến</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Toggle Filters */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {(selectedCategory !== 'all' || selectedChampion !== 'all') && (
                <Badge variant="secondary" className="ml-1">
                  {[selectedCategory !== 'all', selectedChampion !== 'all'].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Category
                      </label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả categories</SelectItem>
                          {initialData.categories && initialData.categories.length > 0 ? initialData.categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name} ({category.count})
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Champion Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4" />
                        Champion
                      </label>
                      <Select value={selectedChampion} onValueChange={setSelectedChampion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn tướng" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả tướng</SelectItem>
                          {initialData.champions && initialData.champions.length > 0 ? initialData.champions.map((champion) => (
                            <SelectItem key={champion.id} value={champion.id.toString()}>
                              {champion.name} ({champion.skinCount})
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active Filters */}
                  {(selectedCategory !== 'all' || selectedChampion !== 'all') && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                      {selectedCategory !== 'all' && initialData.categories && (
                        <Badge variant="secondary" className="gap-1">
                          {initialData.categories.find(c => c.id === selectedCategory)?.name}
                          <button
                            onClick={() => setSelectedCategory('all')}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                      {selectedChampion !== 'all' && initialData.champions && (
                        <Badge variant="secondary" className="gap-1">
                          {initialData.champions.find(c => c.id === parseInt(selectedChampion))?.name}
                          <button
                            onClick={() => setSelectedChampion('all')}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory('all')
                          setSelectedChampion('all')
                        }}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Hiển thị <span className="font-medium text-foreground">{skins ? skins.length : 0}</span> kết quả
            {searchQuery && (
              <> cho "<span className="font-medium text-foreground">{searchQuery}</span>"</>
            )}
          </p>
        </div>

        {/* Skins Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {skins && skins.length > 0 ? skins.map((skin, index) => (
              <motion.div
                key={skin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EnhancedSkinCard 
                  skin={skin}
                  featured={skin.status === 'FEATURED'}
                  onQuickView={handleQuickView}
                />
              </motion.div>
            )) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Loading skins...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {skins && skins.length > 0 ? skins.map((skin, index) => (
              <motion.div
                key={skin.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* List view card */}
                <Card className="p-4">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 relative rounded-lg overflow-hidden">
                      <img
                        src={skin.thumbnailImage || skin.previewImages?.[0] || '/default-skin.svg'}
                        alt={skin.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/default-skin.svg'
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-bold">{skin.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {skin.description}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <span>{skin.champion?.name}</span>
                        <span>{skin.downloadCount} downloads</span>
                        <span>{skin.category?.name}</span>
                      </div>
                    </div>
                    <Link href={`/custom-skins/${skin.id}`}>
                      <Button>View</Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading skins...</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {skins && skins.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy skin nào</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedChampion('all')
              }}
            >
              Xóa bộ lọc
            </Button>
          </motion.div>
        )}

        {/* Load More Button */}
        {skins && skins.length > 0 && skins.length >= 12 && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => {
                setIsLoading(true)
                // Implement load more logic
                setTimeout(() => setIsLoading(false), 1000)
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  Load More
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-12">
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Có skin độc đáo? Chia sẻ với cộng đồng!
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Upload skin của bạn và nhận được sự công nhận từ hàng nghìn game thủ. 
                Tham gia cộng đồng modding sôi động nhất!
              </p>
              <Link href="/custom-skins/submit">
                <Button size="lg" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  Submit Your Skin
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick View Modal */}
      <SkinQuickViewModal
        skin={selectedSkin}
        open={showQuickView}
        onOpenChange={setShowQuickView}
      />
    </div>
  )
}
