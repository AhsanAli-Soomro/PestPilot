"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  Boxes,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Search,
  Filter,
  Wrench,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface ChemicalItem {
  id: string;
  name: string;
  activeIngredient: string;
  epaRegNo: string;
  batchNumber: string;
  quantityOnHand: number;
  unit: string;
  minThreshold: number;
  location: string;
  expirationDate: string;
}

const INITIAL_CHEMICALS: ChemicalItem[] = [
  {
    id: "chem-1",
    name: "Taurus SC Termiticide",
    activeIngredient: "Fipronil 9.1%",
    epaRegNo: "53883-279",
    batchNumber: "LOT-2026-T88",
    quantityOnHand: 14.5,
    unit: "Gallons",
    minThreshold: 5.0,
    location: "Truck 1 & Central Warehouse",
    expirationDate: "Nov 2028",
  },
  {
    id: "chem-2",
    name: "Demand CS Microencapsulated",
    activeIngredient: "Lambda-cyhalothrin 9.7%",
    epaRegNo: "100-1066",
    batchNumber: "LOT-2026-D41",
    quantityOnHand: 22.0,
    unit: "Gallons",
    minThreshold: 8.0,
    location: "Truck 2",
    expirationDate: "Aug 2027",
  },
  {
    id: "chem-3",
    name: "Advion Cockroach Gel Bait",
    activeIngredient: "Indoxacarb 0.6%",
    epaRegNo: "100-1484",
    batchNumber: "LOT-2026-ADV9",
    quantityOnHand: 48,
    unit: "Syringes (30g)",
    minThreshold: 15,
    location: "Technician Field Kits",
    expirationDate: "Jan 2028",
  },
  {
    id: "chem-4",
    name: "Alpine WSG Water Soluble Granule",
    activeIngredient: "Dinotefuran 40.0%",
    epaRegNo: "499-561",
    batchNumber: "LOT-2026-ALP1",
    quantityOnHand: 32,
    unit: "Packets",
    minThreshold: 10,
    location: "Central Warehouse",
    expirationDate: "Oct 2028",
  },
  {
    id: "chem-5",
    name: "Contrac All-Weather Rodent Blox",
    activeIngredient: "Bromadiolone 0.005%",
    epaRegNo: "12455-79",
    batchNumber: "LOT-2026-CB3",
    quantityOnHand: 18,
    unit: "Pails (18 lb)",
    minThreshold: 5,
    location: "Central Warehouse",
    expirationDate: "May 2029",
  },
];

const INITIAL_EQUIPMENT = [
  { id: "eq-1", name: "B&G 1-Gallon Sprayer (Brass Wand)", truck: "Truck 1", status: "OPERATIONAL", lastInspection: "Oct 18, 2026" },
  { id: "eq-2", name: "Milwaukee 4-Gallon Battery Backpack", truck: "Truck 2", status: "OPERATIONAL", lastInspection: "Oct 19, 2026" },
  { id: "eq-3", name: "Sub-Slab Termite Rodding Injection Pump", truck: "Warehouse", status: "CALIBRATED", lastInspection: "Oct 15, 2026" },
];

export function InventoryClient() {
  const [chemicals, setChemicals] = React.useState(INITIAL_CHEMICALS);
  const [equipment, setEquipment] = React.useState(INITIAL_EQUIPMENT);
  const [search, setSearch] = React.useState("");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // Form state
  const [name, setName] = React.useState("");
  const [activeIngredient, setActiveIngredient] = React.useState("");
  const [epaRegNo, setEpaRegNo] = React.useState("");
  const [batchNumber, setBatchNumber] = React.useState("");
  const [quantity, setQuantity] = React.useState("10");
  const [unit, setUnit] = React.useState("Gallons");
  const [location, setLocation] = React.useState("Truck 1");

  const filtered = chemicals.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.epaRegNo.includes(search) ||
      c.batchNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ChemicalItem = {
      id: `chem-${Date.now()}`,
      name,
      activeIngredient,
      epaRegNo,
      batchNumber,
      quantityOnHand: Number(quantity),
      unit,
      minThreshold: 5,
      location,
      expirationDate: "Dec 2028",
    };
    setChemicals([item, ...chemicals]);
    toast.success("Chemical batch added to inventory");
    setIsAddModalOpen(false);
  };

  const handleStockAdjust = (id: string, delta: number) => {
    setChemicals((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, quantityOnHand: Math.max(0, c.quantityOnHand + delta) } : c
      )
    );
    toast.success("Stock quantity adjusted");
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Total EPA Products</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">{chemicals.length} Formulations</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">All products registered &amp; compliant</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Equipment In Fleet</span>
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">{equipment.length} Units</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">100% operational &amp; calibrated</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Reorder Alerts</span>
            <Badge variant="success">All Stocked</Badge>
          </div>
          <div className="text-2xl font-black text-foreground mt-2">0 Low Items</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Above minimum threshold</p>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chemical by name, EPA reg #, or lot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-10"
          />
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="font-bold w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1.5" /> Log New Chemical Batch
        </Button>
      </div>

      {/* Chemical Stock Cards */}
      <div className="space-y-3">
        {filtered.map((chem) => (
          <Card key={chem.id} className="p-4 border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">{chem.name}</h3>
                <Badge variant="outline" className="text-[10px] font-mono">
                  EPA Reg #{chem.epaRegNo}
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {chem.batchNumber}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Active Ingredient: <strong className="text-foreground">{chem.activeIngredient}</strong> &bull; Location: {chem.location}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Exp: {chem.expirationDate} &bull; Min safe reorder: {chem.minThreshold} {chem.unit}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xl font-black text-foreground">{chem.quantityOnHand}</span>
                <span className="text-xs text-muted-foreground block">{chem.unit}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => handleStockAdjust(chem.id, -1)} className="h-8 px-2 text-xs">
                  -1
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleStockAdjust(chem.id, 1)} className="h-8 px-2 text-xs">
                  +1
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Equipment Fleet List */}
      <div className="pt-4 space-y-3">
        <h2 className="text-base font-bold text-foreground">Sprayers &amp; Heavy Fleet Equipment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {equipment.map((eq) => (
            <Card key={eq.id} className="p-3.5 border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-foreground">{eq.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Assigned: {eq.truck}</p>
                  <p className="text-[10px] text-muted-foreground">Inspected: {eq.lastInspection}</p>
                </div>
                <Badge variant="success" className="text-[10px]">
                  {eq.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Chemical Batch Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Chemical Delivery Batch"
        description="Record newly purchased pesticides into your compliance inventory"
        className="max-w-md"
      >
        <form onSubmit={handleAddStock} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Chemical Trade Name *</Label>
            <Input required placeholder="e.g. Taurus SC Termiticide" value={name} onChange={(e) => setName(e.target.value)} className="text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Active Ingredient &amp; %</Label>
            <Input required placeholder="Fipronil 9.1%" value={activeIngredient} onChange={(e) => setActiveIngredient(e.target.value)} className="text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">EPA Registration # *</Label>
              <Input required placeholder="53883-279" value={epaRegNo} onChange={(e) => setEpaRegNo(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Manufacturer Lot / Batch #</Label>
              <Input required placeholder="LOT-2026-X1" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} className="text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quantity Received</Label>
              <Input type="number" step="0.5" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Unit of Measure</Label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-card px-2 text-xs">
                <option value="Gallons">Gallons</option>
                <option value="Syringes (30g)">Syringes (30g)</option>
                <option value="Packets">Packets</option>
                <option value="Pails (18 lb)">Pails (18 lb)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              Save to Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

