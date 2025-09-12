import React from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Phone, Mail, MapPin, Trophy, User, Heart } from 'lucide-react'
import basketballCourt from './assets/basketball-court.jpg'
import profilePhoto from './assets/profile-photo.jpg'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Navigation */}
      <nav className="bg-black/90 backdrop-blur-sm fixed w-full z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏀</span>
              </div>
              <span className="text-white font-bold text-xl">Gandi Portofolio</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#home" className="text-white hover:text-orange-400 transition-colors">Home</a>
              <a href="#about" className="text-white hover:text-orange-400 transition-colors">About</a>
              <a href="#achievements" className="text-white hover:text-orange-400 transition-colors">Prestasi</a>
              <a href="#hobbies" className="text-white hover:text-orange-400 transition-colors">Hobi</a>
              <a href="#contact" className="text-white hover:text-orange-400 transition-colors">Kontak</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${basketballCourt})`,
            filter: 'brightness(0.3)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-orange-900/50" />
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <div className="w-40 h-40 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white">
              <img 
                src={profilePhoto} 
                alt="Gandi Armana Tarigan" 
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Gandi Armana Tarigan
          </h1>
          
          <p className="text-xl md:text-2xl mb-2 text-orange-200">
            Panggilan: <span className="font-semibold text-white">Gandi</span>
          </p>
          
          <p className="text-lg md:text-xl mb-8 text-gray-300">
            Mahasiswa Ilmu Komputer | Basketball Enthusiast | Ex-PASKIBRAKA
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
              onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}
            >
              Lihat Profil
            </Button>
            <Button 
              variant="outline" 
              className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black px-8 py-3 text-lg rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
              onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
            >
              Hubungi Saya
            </Button>
          </div>
        </div>

        {/* Floating Basketball Animation */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-16 h-16 bg-orange-500 rounded-full shadow-lg flex items-center justify-center">
            <span className="text-2xl">🏀</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tentang <span className="text-orange-500">Saya</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Card className="p-8 shadow-xl border-l-4 border-orange-500">
                <CardContent className="p-0">
                  <div className="flex items-center mb-6">
                    <User className="w-8 h-8 text-orange-500 mr-3" />
                    <h3 className="text-2xl font-bold text-gray-900">Profil Pribadi</h3>
                  </div>
                  
                  <div className="space-y-4 text-gray-700">
                    <p className="text-lg leading-relaxed">
                      Saya adalah mahasiswa semester 1 di Program Studi Ilmu Komputer, 
                      Universitas Negeri Medan. Memiliki passion yang besar terhadap teknologi 
                      dan olahraga, khususnya basket.
                    </p>
                    
                    <p className="text-lg leading-relaxed">
                      Sebagai mantan anggota PASKIBRAKA Karo tahun 2022, saya memiliki 
                      pengalaman dalam kepemimpinan, disiplin, dan kerja tim yang kuat.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-6">
                      <Badge className="bg-orange-100 text-orange-800 px-3 py-1">Mahasiswa</Badge>
                      <Badge className="bg-orange-100 text-orange-800 px-3 py-1">Ilmu Komputer</Badge>
                      <Badge className="bg-orange-100 text-orange-800 px-3 py-1">UNIMED</Badge>
                      <Badge className="bg-orange-100 text-orange-800 px-3 py-1">Semester 1</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 rounded-2xl text-white shadow-xl">
                <h4 className="text-2xl font-bold mb-4">Quick Facts</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3" />
                    <span>Karo, Sumatera Utara</span>
                  </div>
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-3" />
                    <span>Mahasiswa Aktif</span>
                  </div>
                  <div className="flex items-center">
                    <Trophy className="w-5 h-5 mr-3" />
                    <span>Ex-PASKIBRAKA 2022</span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 mr-3" />
                    <span>Basketball Player</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section id="achievements" className="py-20 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-orange-400">Prestasi</span> & Pencapaian
            </h2>
            <div className="w-24 h-1 bg-orange-400 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-1 gap-8">
            <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-400/30 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-orange-400 mb-3">
                      PASKIBRAKA Karo 2022
                    </h3>
                    
                    <p className="text-gray-300 text-lg leading-relaxed mb-4">
                      Terpilih sebagai anggota Pasukan Pengibar Bendera Pusaka (PASKIBRAKA) 
                      Kabupaten Karo tahun 2022. Merupakan kehormatan besar untuk dapat 
                      berpartisipasi dalam upacara kemerdekaan Indonesia.
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">Kepemimpinan</Badge>
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">Disiplin</Badge>
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">Nasionalisme</Badge>
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">Kerja Tim</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Hobbies Section */}
      <section id="hobbies" className="py-20 bg-orange-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Hobi & <span className="text-orange-500">Minat</span>
            </h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-1 gap-8">
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 border-l-4 border-orange-500">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-3xl">🏀</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Basketball</h3>
                    
                    <p className="text-gray-700 text-lg leading-relaxed mb-6">
                      Basketball adalah passion utama saya. Olahraga ini tidak hanya memberikan 
                      kebugaran fisik, tetapi juga mengajarkan strategi, kerja tim, dan mental 
                      yang kuat. Saya menikmati setiap aspek dari permainan ini, mulai dari 
                      teknik dasar hingga strategi tim yang kompleks.
                    </p>
                    
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-orange-100 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">Posisi Favorit</h4>
                        <p className="text-orange-700">Center</p>
                      </div>
                      <div className="bg-orange-100 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">Skill Focus</h4>
                        <p className="text-orange-700">Shooting, Ball Handling, Defense</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-orange-500 text-white">Team Player</Badge>
                      <Badge className="bg-orange-500 text-white">Strategic Thinking</Badge>
                      <Badge className="bg-orange-500 text-white">Physical Fitness</Badge>
                      <Badge className="bg-orange-500 text-white">Mental Toughness</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Hubungi <span className="text-orange-400">Saya</span>
            </h2>
            <div className="w-24 h-1 bg-orange-400 mx-auto rounded-full"></div>
            <p className="text-xl text-gray-300 mt-6">
              Mari terhubung dan berkolaborasi!
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-8">
            <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-400/30 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-orange-400">Nomor Telepon</h3>
                      <p className="text-gray-300 text-lg">082236376588</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-orange-400">Lokasi</h3>
                      <p className="text-gray-300 text-lg">Karo, Sumatera Utara</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-orange-400">Status</h3>
                      <p className="text-gray-300 text-lg">Mahasiswa Aktif - Universitas Negeri Medan</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-orange-400/30">
                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 text-lg rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => window.open(`tel:082236376588`, '_blank')}
                  >
                    Hubungi Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏀</span>
              </div>
              <span className="text-white font-bold text-xl">Gandi Armana Tarigan</span>
            </div>
            <p className="text-gray-400">
              © 2024 Gandi Armana Tarigan. Basketball Enthusiast & Computer Science Student.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

