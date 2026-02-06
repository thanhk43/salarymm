'use client'

import { useState } from 'react'
import { Settings, Shield, Bell, Database, Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý cấu hình hệ thống</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            Chung
          </TabsTrigger>
          <TabsTrigger value="salary">
            <Database className="mr-2 h-4 w-4" />
            Lương & Bảo hiểm
          </TabsTrigger>
          <TabsTrigger value="about">
            <Info className="mr-2 h-4 w-4" />
            Thông tin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin công ty</CardTitle>
              <CardDescription>Cấu hình thông tin cơ bản của công ty</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Tên công ty</Label>
                  <Input id="companyName" defaultValue="SalaryMM Company" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxCode">Mã số thuế</Label>
                  <Input id="taxCode" placeholder="0123456789" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input id="address" placeholder="123 Đường ABC, Quận XYZ, TP.HCM" />
              </div>
              <Button>Lưu thay đổi</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tỷ lệ bảo hiểm</CardTitle>
              <CardDescription>Cấu hình tỷ lệ đóng bảo hiểm theo quy định (có hiệu lực từ 01/07/2025)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3">Phần người lao động đóng</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>BHXH</Label>
                      <div className="flex items-center gap-2">
                        <Input defaultValue="8" disabled className="w-20" />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>BHYT</Label>
                      <div className="flex items-center gap-2">
                        <Input defaultValue="1.5" disabled className="w-20" />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>BHTN</Label>
                      <div className="flex items-center gap-2">
                        <Input defaultValue="1" disabled className="w-20" />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3">Phần doanh nghiệp đóng</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>BHXH</Label>
                      <div className="flex items-center gap-2">
                        <Input defaultValue="17" disabled className="w-20" />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>BHYT</Label>
                      <div className="flex items-center gap-2">
                        <Input defaultValue="3" disabled className="w-20" />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>BHTN</Label>
                      <div className="flex items-center gap-2">
                        <Input defaultValue="1" disabled className="w-20" />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium mb-2">Giảm trừ thuế TNCN</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Giảm trừ bản thân:</span>
                      <span className="ml-2 font-mono">11,000,000 VNĐ/tháng</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Giảm trừ người phụ thuộc:</span>
                      <span className="ml-2 font-mono">4,400,000 VNĐ/người/tháng</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium mb-2">Mức lương tối đa đóng BHXH</h4>
                  <p className="text-sm text-muted-foreground">
                    20 lần mức lương cơ sở = <span className="font-mono">46,800,000 VNĐ</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biểu thuế TNCN lũy tiến</CardTitle>
              <CardDescription>Thuế suất theo từng bậc thu nhập chịu thuế</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left">Bậc</th>
                      <th className="p-3 text-left">Thu nhập chịu thuế/tháng</th>
                      <th className="p-3 text-right">Thuế suất</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">1</td>
                      <td className="p-3">Đến 5 triệu VNĐ</td>
                      <td className="p-3 text-right font-mono">5%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">2</td>
                      <td className="p-3">Trên 5 triệu - 10 triệu VNĐ</td>
                      <td className="p-3 text-right font-mono">10%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">3</td>
                      <td className="p-3">Trên 10 triệu - 18 triệu VNĐ</td>
                      <td className="p-3 text-right font-mono">15%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">4</td>
                      <td className="p-3">Trên 18 triệu - 32 triệu VNĐ</td>
                      <td className="p-3 text-right font-mono">20%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">5</td>
                      <td className="p-3">Trên 32 triệu - 52 triệu VNĐ</td>
                      <td className="p-3 text-right font-mono">25%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">6</td>
                      <td className="p-3">Trên 52 triệu - 80 triệu VNĐ</td>
                      <td className="p-3 text-right font-mono">30%</td>
                    </tr>
                    <tr>
                      <td className="p-3">7</td>
                      <td className="p-3">Trên 80 triệu VNĐ</td>
                      <td className="p-3 text-right font-mono">35%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hệ thống</CardTitle>
              <CardDescription>Chi tiết về phiên bản và công nghệ sử dụng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tên ứng dụng</p>
                  <p className="font-medium">SalaryMM</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phiên bản</p>
                  <Badge variant="outline">v1.0.0</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Framework</p>
                  <p className="font-medium">Next.js 16</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Database</p>
                  <p className="font-medium">PostgreSQL 16</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ORM</p>
                  <p className="font-medium">Prisma 7</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">UI Library</p>
                  <p className="font-medium">Shadcn/UI + Tailwind CSS v4</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Mô tả</h4>
                <p className="text-sm text-muted-foreground">
                  SalaryMM là hệ thống quản lý lương nhân viên dành cho doanh nghiệp Việt Nam.
                  Hệ thống hỗ trợ tính toán lương tự động theo quy định BHXH, BHYT, BHTN và thuế TNCN
                  của Việt Nam (có hiệu lực từ 01/07/2025).
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Tính năng chính</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Quản lý nhân viên, phòng ban, chức vụ</li>
                  <li>✓ Quản lý thưởng với quy trình phê duyệt</li>
                  <li>✓ Tính lương tự động theo tháng</li>
                  <li>✓ Tính toán BHXH, BHYT, BHTN, thuế TNCN</li>
                  <li>✓ Xuất phiếu lương</li>
                  <li>✓ Phân quyền Admin/Employee</li>
                  <li>✓ Nhân viên tự xem phiếu lương cá nhân</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
