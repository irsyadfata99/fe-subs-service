"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Bell, Users, Calendar, Zap, MessageSquare, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const whatsappNumber = "+6285117580980"; // Ganti dengan nomor WhatsApp Anda
  const whatsappMessage = encodeURIComponent("Halo, saya tertarik dengan AutoReminder!");

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AutoReminder</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button className="border border-gray-300 hover:bg-gray-100">Login</Button>
              </Link>
              <Button onClick={handleWhatsAppClick} className="bg-green-600 hover:bg-green-700 text-white">
                Hubungi Kami
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Tagihan Terlupakan?
            <br />
            <span className="text-blue-600">Biarkan Kami yang Ingatkan</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Sistem reminder pembayaran otomatis via WhatsApp untuk bisnis kost, gym, salon, dan subscription bulanan lainnya.</p>
          <Button onClick={handleWhatsAppClick} size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6">
            <MessageSquare className="mr-2 h-5 w-5" />
            Konsultasi Gratis via WhatsApp
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Masalah yang Sering Dialami Pemilik Bisnis</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-red-200 bg-white">
              <CardContent className="pt-6">
                <div className="text-red-500 mb-4">
                  <Clock className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Lupa Menagih</h3>
                <p className="text-gray-600">Sibuk dengan operasional, sering lupa mengingatkan pelanggan yang hampir jatuh tempo. Akhirnya cash flow terganggu.</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-white">
              <CardContent className="pt-6">
                <div className="text-red-500 mb-4">
                  <Users className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Banyak Pelanggan</h3>
                <p className="text-gray-600">Puluhan hingga ratusan pelanggan dengan tanggal jatuh tempo berbeda-beda. Ribet dan makan waktu untuk mengingatkan manual.</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-white">
              <CardContent className="pt-6">
                <div className="text-red-500 mb-4">
                  <MessageSquare className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Chat Berantakan</h3>
                <p className="text-gray-600">WhatsApp penuh dengan chat pelanggan. Sulit tracking siapa yang sudah dibayar, siapa yang belum, dan siapa yang telat.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pain Point Amplification */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-red-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Akibatnya? Kerugian Besar!</h2>
          <div className="space-y-4 text-lg text-gray-700 mb-8">
            <p className="flex items-center justify-center gap-3">
              <span>
                <strong>Cash flow tidak stabil</strong> - Banyak pelanggan telat bayar
              </span>
            </p>
            <p className="flex items-center justify-center gap-3">
              <span>
                <strong>Stres berlebihan</strong> - Harus ingat semua tanggal jatuh tempo
              </span>
            </p>
            <p className="flex items-center justify-center gap-3">
              <span>
                <strong>Buang waktu</strong> - 2-3 jam per hari hanya untuk kirim reminder manual
              </span>
            </p>
            <p className="flex items-center justify-center gap-3">
              <span>
                <strong>Hubungan pelanggan memburuk</strong> - Sering telat nagih atau malah lupa sama sekali
              </span>
            </p>
          </div>
          <Button onClick={handleWhatsAppClick} size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6">
            Saya Tidak Mau Rugi Lagi! Hubungi Sekarang
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">Solusi Lengkap AutoReminder</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">Semua fitur yang Anda butuhkan untuk mengelola tagihan pelanggan dengan mudah</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-blue-600 mb-4">
                  <Bell className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Reminder Otomatis</h3>
                <p className="text-gray-600 text-sm">Kirim reminder via WhatsApp 3 hari sebelum, 1 hari sebelum, dan saat jatuh tempo secara otomatis.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-blue-600 mb-4">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Kelola Pelanggan</h3>
                <p className="text-gray-600 text-sm">Database pelanggan lengkap dengan paket, harga, dan tanggal jatuh tempo yang bisa diatur sesuai kebutuhan.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-blue-600 mb-4">
                  <Calendar className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Tracking Pembayaran</h3>
                <p className="text-gray-600 text-sm">Lihat status pembayaran real-time: siapa yang sudah bayar, belum bayar, atau terlambat.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-blue-600 mb-4">
                  <Zap className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Bulk Operations</h3>
                <p className="text-gray-600 text-sm">Mark paid banyak pelanggan sekaligus dalam satu klik. Hemat waktu untuk update massal.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-blue-600 mb-4">
                  <TrendingUp className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Dashboard Analytics</h3>
                <p className="text-gray-600 text-sm">Lihat statistik bisnis: total pelanggan aktif, pending payment, dan estimasi pendapatan bulanan.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-blue-600 mb-4">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">WhatsApp Terintegrasi</h3>
                <p className="text-gray-600 text-sm">Semua reminder dikirim langsung via WhatsApp ke nomor pelanggan Anda dengan branding bisnis.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-blue-600 mb-4">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Custom Package</h3>
                <p className="text-gray-600 text-sm">Buat paket subscription custom untuk setiap pelanggan dengan harga dan billing cycle berbeda.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-blue-600 mb-4">
                  <Clock className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Trial 90 Hari</h3>
                <p className="text-gray-600 text-sm">Coba gratis selama 90 hari tanpa kartu kredit. Buktikan manfaatnya sebelum berlangganan.</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button onClick={handleWhatsAppClick} size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6">
              Saya Mau Coba Fitur-Fitur Ini!
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">Harga yang Sangat Terjangkau</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">Investasi kecil untuk menyelamatkan cash flow bisnis Anda</p>

          <Card className="border-2 border-blue-500 shadow-xl bg-white">
            <CardContent className="pt-8 text-center">
              <div className="mb-6">
                <p className="text-gray-500 text-lg mb-2">Biaya per pelanggan aktif</p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className="text-2xl text-gray-400 line-through">Rp 5.000</span>
                  <span className="text-5xl font-bold text-blue-600">Rp 3.000</span>
                  <span className="text-xl text-gray-600">/bulan</span>
                </div>
                <div className="inline-block bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">Hemat 40%! Promo Terbatas</div>
              </div>

              <div className="space-y-3 mb-8 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Trial gratis 90 hari tanpa kartu kredit</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Reminder otomatis unlimited via WhatsApp</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Dashboard analytics lengkap</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Support via WhatsApp setiap hari</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Kelola unlimited pelanggan</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Update fitur gratis selamanya</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Contoh:</strong> Punya 50 pelanggan aktif? <br />
                  Hanya <span className="text-blue-600 font-bold">Rp 150.000/bulan</span>
                  <br />
                  <span className="text-xs text-gray-500">(Lebih murah dari gaji admin part-time!)</span>
                </p>
              </div>

              <Button onClick={handleWhatsAppClick} size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6 w-full">
                Mulai Trial 90 Hari Gratis Sekarang!
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">Dipercaya Oleh Banyak Pemilik Bisnis</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">Lihat apa kata mereka tentang AutoReminder</p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">BP</div>
                  <div>
                    <p className="font-semibold text-gray-900">Budi Prasetyo</p>
                    <p className="text-sm text-gray-600">Pemilik Kost Mawar</p>
                  </div>
                </div>
                <div className="text-yellow-400 mb-3">★★★★★</div>
                <p className="text-gray-700 italic">&quot;Dulu saya habis 2-3 jam setiap hari cuma buat kirim reminder manual. Sekarang semua otomatis! Cash flow jadi lancar karena jarang ada yang telat bayar.&quot;</p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">SL</div>
                  <div>
                    <p className="font-semibold text-gray-900">Sari Lestari</p>
                    <p className="text-sm text-gray-600">Owner Gym Sehat Selalu</p>
                  </div>
                </div>
                <div className="text-yellow-400 mb-3">★★★★★</div>
                <p className="text-gray-700 italic">&quot;Punya 80+ member dengan tanggal jatuh tempo berbeda-beda. AutoReminder menyelamatkan bisnis saya! Sekarang tidak ada lagi member yang terlupakan.&quot;</p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">RK</div>
                  <div>
                    <p className="font-semibold text-gray-900">Rina Kartika</p>
                    <p className="text-sm text-gray-600">Pemilik Salon Cantik</p>
                  </div>
                </div>
                <div className="text-yellow-400 mb-3">★★★★★</div>
                <p className="text-gray-700 italic">&quot;Harganya sangat terjangkau! Cuma Rp 3.000 per pelanggan tapi menghemat waktu saya berjam-jam. ROI-nya gila-gilaan!&quot;</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button onClick={handleWhatsAppClick} size="lg" className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6">
              Saya Juga Mau Sukses Seperti Mereka!
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Siap Menyelamatkan Cash Flow Bisnis Anda?</h2>
          <p className="text-xl mb-8 text-blue-100">Hubungi kami sekarang untuk konsultasi gratis dan demo aplikasi</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-6 w-6" />
              <span>WhatsApp: 0851-1758-0980</span>
            </div>
          </div>

          <Button onClick={handleWhatsAppClick} size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-10 py-6 text-white">
            <MessageSquare className="mr-2 h-6 w-6" />
            Chat Sekarang di WhatsApp
          </Button>

          <p className="mt-6 text-blue-100 text-sm">Response time: &lt; 5 menit • Available: Senin - Minggu, 08:00 - 22:00 WIB</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold text-white">AutoReminder</span>
            </div>

            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">Solusi reminder pembayaran otomatis untuk bisnis subscription Anda.</p>
            </div>

            <div className="flex gap-6">
              <Link href="/login" className="text-sm hover:text-white transition-colors">
                Login
              </Link>
              <a href="#" className="text-sm hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm hover:text-white transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-400">
            <p>&copy; 2024 AutoReminder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
