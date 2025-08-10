"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin } from "lucide-react"
import { findCitiesByName, type City } from "@/lib/cities"

type Props = {
  value: string
  onChange: (value: string) => void
  onCitySelect: (city: City) => void
  placeholder?: string
  className?: string
}

export default function CitySearch({ value, onChange, onCitySelect, placeholder, className }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length >= 2) {
      const results = findCitiesByName(value)
      setSuggestions(results)
      setIsOpen(results.length > 0)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
    setSelectedIndex(-1)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleCitySelect = (city: City) => {
    onCitySelect(city)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleCitySelect(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleBlur = () => {
    // Delay closing to allow for city selection
    setTimeout(() => setIsOpen(false), 150)
  }

  const handleFocus = () => {
    if (value.length >= 2 && suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder || "Search cities..."}
          className={`pl-8 ${className || ""}`}
          aria-label="Search cities"
          autoComplete="off"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border-zinc-200">
          <CardContent className="p-0">
            <div ref={listRef} className="max-h-60 overflow-y-auto">
              {suggestions.map((city, index) => (
                <Button
                  key={city.fullName}
                  variant="ghost"
                  className={`w-full justify-start rounded-none p-3 h-auto text-left ${
                    index === selectedIndex ? "bg-violet-50 text-violet-700" : ""
                  }`}
                  onClick={() => handleCitySelect(city)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <MapPin className="size-4 text-zinc-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{city.name}</div>
                      <div className="text-xs text-zinc-500 truncate">
                        {city.country} • {city.restaurantCount} restaurant{city.restaurantCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}