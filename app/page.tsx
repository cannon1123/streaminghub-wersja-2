"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "WKLEJ_TUTAJ_PROJECT_URL" // Replace with your Project URL
const SUPABASE_KEY = "WKLEJ_TUTAJ_ANON_KEY" // Replace with your anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default function StreamingHub() {
  const [user, setUser] = useState(null)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedYear, setSelectedYear] = useState("")

  useEffect(() => {
    // Block common developer shortcuts
    const blockShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C" || e.key === "J")) ||
        (e.ctrlKey && e.key === "U") ||
        (e.ctrlKey && e.key === "S")
      ) {
        e.preventDefault()
        return false
      }
    }

    // Block right-click context menu
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    document.addEventListener("keydown", blockShortcuts)
    document.addEventListener("contextmenu", blockContextMenu)

    return () => {
      document.removeEventListener("keydown", blockShortcuts)
      document.removeEventListener("contextmenu", blockContextMenu)
    }
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const loadMovies = async () => {
      try {
        let query = supabase.from("movies").select("*")

        if (searchTerm) {
          query = query.ilike("title", `%${searchTerm}%`)
        }
        if (selectedCategory) {
          query = query.eq("category", selectedCategory)
        }
        if (selectedYear) {
          query = query.eq("year", selectedYear)
        }

        const { data, error } = await query.order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading movies:", error)
        } else {
          setMovies(data || [])
        }
      } catch (error) {
        console.error("Error:", error)
      }
    }

    loadMovies()
  }, [searchTerm, selectedCategory, selectedYear])

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert("Błąd logowania: " + error.message)
    } else {
      setShowLogin(false)
    }
  }

  const handleRegister = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      alert("Błąd rejestracji: " + error.message)
    } else {
      alert("Sprawdź email aby potwierdzić konto")
      setShowRegister(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Ładowanie...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-red-500">🎬 StreamingHub</h1>
            <input
              type="text"
              placeholder="Szukaj filmów..."
              className="bg-gray-700 text-white px-4 py-2 rounded-lg w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <nav className="flex items-center space-x-4">
            <span>Filmy</span>
            <span>TOP</span>
            {user ? (
              <>
                <span>Moja biblioteka</span>
                <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded">
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowLogin(true)} className="bg-blue-600 px-4 py-2 rounded">
                  Zaloguj
                </button>
                <button onClick={() => setShowRegister(true)} className="bg-green-600 px-4 py-2 rounded">
                  Zarejestruj
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl mb-4">Filtruj</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2">Kategoria</label>
              <select
                className="w-full bg-gray-700 text-white p-2 rounded"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Wszystkie</option>
                <option value="Akcja">Akcja</option>
                <option value="Komedia">Komedia</option>
                <option value="Dramat">Dramat</option>
                <option value="Horror">Horror</option>
                <option value="Sci-Fi">Sci-Fi</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Rok</label>
              <select
                className="w-full bg-gray-700 text-white p-2 rounded"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Wszystkie</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {movies.map((movie: any) => (
            <div key={movie.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
              <img
                src={movie.poster_url || "/placeholder.svg?height=300&width=200&query=movie poster"}
                alt={movie.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-1">{movie.title}</h3>
                <p className="text-gray-400 text-xs">
                  czas: {movie.duration} min • rok: {movie.year}
                </p>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-yellow-400 ${i < (movie.rating || 0) ? "opacity-100" : "opacity-30"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {movies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Brak filmów do wyświetlenia</p>
            <p className="text-gray-500 text-sm mt-2">Sprawdź konfigurację Supabase lub dodaj filmy do bazy danych</p>
          </div>
        )}
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4">Logowanie</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                handleLogin(formData.get("email") as string, formData.get("password") as string)
              }}
            >
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full bg-gray-700 text-white p-3 rounded mb-3"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Hasło"
                className="w-full bg-gray-700 text-white p-3 rounded mb-4"
                required
              />
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-3 rounded">
                  Zaloguj
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="flex-1 bg-gray-600 text-white p-3 rounded"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4">Rejestracja</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                handleRegister(formData.get("email") as string, formData.get("password") as string)
              }}
            >
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full bg-gray-700 text-white p-3 rounded mb-3"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Hasło"
                className="w-full bg-gray-700 text-white p-3 rounded mb-4"
                required
              />
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-green-600 text-white p-3 rounded">
                  Zarejestruj
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="flex-1 bg-gray-600 text-white p-3 rounded"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 text-center py-4 mt-12">
        <p className="text-gray-400">© 2025 StreamingHub • free video</p>
      </footer>
    </div>
  )
}
