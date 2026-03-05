import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  MapPin,
  Recycle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Leaf,
  Package,
  Award,
  Calendar,
  Users,
  ShieldCheck,
  UserPlus,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';

const MATERIAL_TYPES = [
  'Plástico PET',
  'Plástico HDPE',
  'Plástico LDPE',
  'Plástico PP',
  'Plástico PS',
  'Plástico Otros',
  'Papel Blanco',
  'Papel Periódico',
  'Cartón',
  'Papel Mixto',
  'Vidrio Transparente',
  'Vidrio Color',
  'Vidrio Templado',
  'Aluminio',
  'Acero',
  'Cobre',
  'Metal Mixto',
  'Electrónicos',
  'Baterías',
  'Aceite Usado',
  'Textiles',
  'Orgánico',
];

interface RecyclingPoint {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  status: string;
  acceptedMaterials: Array<{
    materialType: string;
    rewardPerKg: number;
  }>;
}

interface Submission {
  _id: string;
  submissionCode: string;
  recyclingPoint?: {
    _id: string;
    name?: string;
    address?: string;
    city?: string;
  };
  materials: Array<{
    materialType: string;
    estimatedWeight: number;
    actualWeight?: number;
  }>;
  verification?: {
    status?: string;
  };
  rewards?: {
    estimatedEcoCoins?: number;
    totalEcoCoins?: number;
  };
  tracking?: {
    currentStatus?: string;
  };
  createdAt: string;
}

interface RecyclingStats {
  totalWeight: number;
  totalEcoCoins: number;
  totalCO2Saved: number;
  totalEnergySaved: number;
  totalWaterSaved: number;
  equivalentTrees: number;
}

interface PointOperator {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  isActive?: boolean;
  createdAt?: string;
}

interface PointDashboard {
  point: {
    id: string;
    name: string;
    city: string;
    status: string;
  };
  statusCounts: Record<string, number>;
  totals: {
    totalSubmissions: number;
    totalEcoCoins: number;
    totalKg: number;
  };
  recentSubmissions: any[];
}

export function RecyclingPage() {
  const { user, refreshProfile } = useAuth();
  const isAdmin = Boolean(user?.recyclingAccess?.isAdmin);
  const isOperator = Boolean(user?.recyclingAccess?.isOperator);
  const isStaff = Boolean(user?.recyclingAccess?.isStaff);
  // Según arquitectura: el admin gestiona punto y operadores (tab Admin).
  // El operador registra entregas (tab Operador).
  // Un admin NO interactúa directamente con entregas → no ve tab Operador.
  // isOperator (del backend) ya excluye a usuarios que son admin: operatorPointIds.length > 0 && !isAdmin
  const showOperatorTab = isOperator;
  const showAdminTab = isAdmin;

  const defaultTab = showAdminTab ? 'admin' : showOperatorTab ? 'operator' : 'map';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [recyclingPoints, setRecyclingPoints] = useState<RecyclingPoint[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<RecyclingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState('');
  const [newSubmission, setNewSubmission] = useState({
    materials: [{ materialType: '', estimatedWeight: '' }],
    notes: '',
  });

  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [staffPointId, setStaffPointId] = useState('');
  const [staffUserRecyclingCode, setStaffUserRecyclingCode] = useState('');
  const [staffSubmission, setStaffSubmission] = useState({
    materials: [{ materialType: '', estimatedWeight: '' }],
    notes: '',
  });
  const [staffPointStats, setStaffPointStats] = useState<any[] | null>(null);

  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminPointId, setAdminPointId] = useState('');
  const [adminPendingStatus, setAdminPendingStatus] = useState<'pending' | 'in_review'>('pending');
  const [adminPending, setAdminPending] = useState<Submission[]>([]);
  const [adminDashboard, setAdminDashboard] = useState<PointDashboard | null>(null);
  const [adminOperators, setAdminOperators] = useState<PointOperator[]>([]);
  const [newOperator, setNewOperator] = useState({ username: '', email: '', password: '' });
  const [assignOperatorEmail, setAssignOperatorEmail] = useState('');
  const [newPoint, setNewPoint] = useState({ name: '', address: '', city: '', state: '' });
  const [isCreatingPoint, setIsCreatingPoint] = useState(false);

  const adminPointIds = new Set<string>(user?.recyclingAccess?.adminPointIds || []);
  const operatorPointIds = new Set<string>(user?.recyclingAccess?.operatorPointIds || []);
  const getPointId = (p: any) => String(p?._id ?? p?.id ?? '');
  const allowedOperatorPoints = recyclingPoints.filter((p) => {
    const id = getPointId(p);
    return Boolean(id) && (adminPointIds.has(id) || operatorPointIds.has(id));
  });
  const allowedAdminPoints = recyclingPoints.filter((p) => {
    const id = getPointId(p);
    return Boolean(id) && adminPointIds.has(id);
  });

  useEffect(() => {
    loadRecyclingPoints();
  }, []);

  useEffect(() => {
    if (staffPointId && !allowedOperatorPoints.some((p) => getPointId(p) === staffPointId)) {
      setStaffPointId('');
    }
    if (adminPointId && !allowedAdminPoints.some((p) => getPointId(p) === adminPointId)) {
      setAdminPointId('');
    }
  }, [adminPointId, allowedAdminPoints, allowedOperatorPoints, staffPointId]);

  useEffect(() => {
    const allowed = new Set<string>(['map']);
    if (!isStaff) {
      allowed.add('submit');
      allowed.add('history');
      allowed.add('stats');
    }
    if (showOperatorTab) allowed.add('operator');
    if (showAdminTab) allowed.add('admin');

    if (!allowed.has(activeTab)) {
      setActiveTab(defaultTab);
    }
  }, [activeTab, defaultTab, isStaff, showAdminTab, showOperatorTab]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadSubmissions();
    } else if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  const loadRecyclingPoints = async () => {
    setIsLoading(true);
    try {
      const response = await api.getRecyclingPoints({ status: 'active' });
      if (response.success && response.data) {
        const points = (response.data as any).recyclingPoints ?? response.data;
        setRecyclingPoints(points || []);
      }
    } catch (error) {
      console.error('Error loading recycling points:', error);
      toast.error('Error al cargar puntos de reciclaje');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await api.getUserSubmissions();
      if (response.success && response.data) {
        const nextSubmissions = (response.data as any).submissions ?? response.data;
        setSubmissions(nextSubmissions || []);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await api.getUserRecyclingStats();
      if (response.success && response.data) {
        const backendStats = (response.data as any).stats;
        setStats({
          totalWeight: backendStats?.totalKgRecycled ?? 0,
          totalEcoCoins: backendStats?.totalEcoCoinsEarned ?? 0,
          totalCO2Saved: backendStats?.totalCO2Saved ?? 0,
          totalEnergySaved: backendStats?.totalEnergySaved ?? 0,
          totalWaterSaved: backendStats?.totalWaterSaved ?? 0,
          equivalentTrees: backendStats?.treesEquivalent ?? 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMaterial = () => {
    setNewSubmission({
      ...newSubmission,
      materials: [
        ...newSubmission.materials,
        { materialType: '', estimatedWeight: '' },
      ],
    });
  };

  const handleStaffAddMaterial = () => {
    setStaffSubmission({
      ...staffSubmission,
      materials: [...staffSubmission.materials, { materialType: '', estimatedWeight: '' }],
    });
  };

  const handleStaffRemoveMaterial = (index: number) => {
    const updated = staffSubmission.materials.filter((_, i) => i !== index);
    setStaffSubmission({ ...staffSubmission, materials: updated });
  };

  const handleStaffMaterialChange = (index: number, field: string, value: string) => {
    const updated = [...staffSubmission.materials];
    updated[index] = { ...updated[index], [field]: value };
    setStaffSubmission({ ...staffSubmission, materials: updated });
  };

  const handleRemoveMaterial = (index: number) => {
    const updated = newSubmission.materials.filter((_, i) => i !== index);
    setNewSubmission({ ...newSubmission, materials: updated });
  };

  const handleMaterialChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...newSubmission.materials];
    updated[index] = { ...updated[index], [field]: value };
    setNewSubmission({ ...newSubmission, materials: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPoint) {
      toast.error('Selecciona un punto de reciclaje');
      return;
    }

    const validMaterials = newSubmission.materials.filter(
      (m) => m.materialType && m.estimatedWeight
    );

    if (validMaterials.length === 0) {
      toast.error('Agrega al menos un material');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.createRecyclingSubmission({
        recyclingPointId: selectedPoint,
        materials: validMaterials.map((m) => ({
          materialType: m.materialType,
          estimatedWeight: Number(m.estimatedWeight),
          condition: 'Bueno',
        })),
        submissionNotes: newSubmission.notes,
      });

      if (response.success) {
        toast.success(
          `¡Entrega registrada! Código: ${response.data?.submissionCode || ''}`
        );
        setNewSubmission({
          materials: [{ materialType: '', estimatedWeight: '' }],
          notes: '',
        });
        setSelectedPoint('');
        setActiveTab('history');
        loadSubmissions();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar entrega');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'Aprobado':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
      case 'Rechazado':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'Aprobado':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'Rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      case 'in_review':
        return 'En revisión';
      case 'partially_approved':
        return 'Parcial';
      case 'pending':
      default:
        return 'Pendiente';
    }
  };

  const getMaterialOptions = () => {
    const point = recyclingPoints.find((p) => p._id === selectedPoint);
    if (point?.acceptedMaterials?.length) {
      return point.acceptedMaterials.map((m) => m.materialType);
    }
    return MATERIAL_TYPES;
  };

  const getMaterialOptionsForPoint = (pointId: string) => {
    const point = recyclingPoints.find((p) => p._id === pointId);
    if (point?.acceptedMaterials?.length) {
      return point.acceptedMaterials.map((m) => m.materialType);
    }
    return MATERIAL_TYPES;
  };

  const handleStaffRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffPointId) {
      toast.error('Selecciona un punto de reciclaje');
      return;
    }

    if (!staffUserRecyclingCode.trim()) {
      toast.error('Ingresa el código del usuario');
      return;
    }

    const validMaterials = staffSubmission.materials.filter(
      (m) => m.materialType && m.estimatedWeight
    );

    if (validMaterials.length === 0) {
      toast.error('Agrega al menos un material');
      return;
    }

    setIsStaffLoading(true);
    try {
      const response = await api.registerDeliveryByOperator(staffPointId, {
        userRecyclingCode: staffUserRecyclingCode.trim(),
        materials: validMaterials.map((m) => ({
          materialType: m.materialType,
          estimatedWeight: Number(m.estimatedWeight),
          condition: 'Bueno',
        })),
        submissionNotes: staffSubmission.notes,
      });

      if (response.success) {
        toast.success(`Entrega registrada. Código: ${response.data?.submissionCode || ''}`);
        setStaffUserRecyclingCode('');
        setStaffSubmission({ materials: [{ materialType: '', estimatedWeight: '' }], notes: '' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar entrega');
    } finally {
      setIsStaffLoading(false);
    }
  };

  const loadStaffPointStats = async () => {
    if (!staffPointId) {
      toast.error('Selecciona un punto de reciclaje');
      return;
    }
    setIsStaffLoading(true);
    try {
      const response = await api.getPointDeliveryStats(staffPointId);
      if (response.success && response.data) {
        setStaffPointStats((response.data as any).stats ?? (response.data as any).data?.stats ?? (response.data as any).stats);
      }
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar estadísticas');
    } finally {
      setIsStaffLoading(false);
    }
  };

  const loadAdminDashboard = async () => {
    if (!adminPointId) {
      toast.error('Selecciona un punto de reciclaje');
      return;
    }
    setIsAdminLoading(true);
    try {
      const response = await api.getPointDashboard(adminPointId);
      if (response.success && response.data) {
        setAdminDashboard((response.data as any) as PointDashboard);
      }
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar dashboard');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const loadAdminOperators = async () => {
    if (!adminPointId) {
      toast.error('Selecciona un punto de reciclaje');
      return;
    }
    setIsAdminLoading(true);
    try {
      const response = await api.listPointOperators(adminPointId);
      if (response.success && response.data) {
        const ops = (response.data as any).operators ?? response.data;
        setAdminOperators(ops || []);
      }
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar operadores');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const createAdminOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPointId) {
      toast.error('Selecciona un punto de reciclaje');
      return;
    }
    if (!newOperator.username || !newOperator.email) {
      toast.error('Completa username y email');
      return;
    }
    if (newOperator.password && newOperator.password.trim().length > 0 && newOperator.password.trim().length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setIsAdminLoading(true);
    try {
      const payload: any = {
        username: newOperator.username.trim(),
        email: newOperator.email.trim(),
      };
      if (newOperator.password && newOperator.password.trim().length > 0) {
        payload.password = newOperator.password.trim();
      }
      const response = await api.createPointOperator(adminPointId, payload);
      const generatedPassword = (response as any)?.data?.generatedPassword;
      if (generatedPassword) {
        toast.success(`Operador creado. Password generado: ${generatedPassword}`);
      } else {
        toast.success((response as any)?.message || 'Operador creado');
      }
      setNewOperator({ username: '', email: '', password: '' });
      await loadAdminOperators();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo crear el operador');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const assignExistingAdminOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPointId) {
      toast.error('Selecciona un punto de reciclaje');
      return;
    }
    const email = assignOperatorEmail.trim();
    if (!email) {
      toast.error('Ingresa el email del operador');
      return;
    }
    setIsAdminLoading(true);
    try {
      const response = await api.createPointOperator(adminPointId, { email });
      toast.success((response as any)?.message || 'Operador asignado');
      setAssignOperatorEmail('');
      await loadAdminOperators();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo asignar el operador');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const removeAdminOperator = async (operatorUserId: string) => {
    if (!adminPointId) return;
    if (!confirm('¿Desasignar operador del punto? (No elimina el usuario)')) return;
    setIsAdminLoading(true);
    try {
      await api.removePointOperator(adminPointId, operatorUserId);
      toast.success('Operador desasignado');
      await loadAdminOperators();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo remover');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const loadAdminPending = async () => {
    if (!adminPointId) {
      toast.error('Selecciona un punto de reciclaje');
      return;
    }
    setIsAdminLoading(true);
    try {
      const response = await api.getPendingSubmissions({
        recyclingPointId: adminPointId,
        status: adminPendingStatus,
        limit: 50,
      });
      if (response.success && response.data) {
        const next = (response.data as any).submissions ?? response.data;
        setAdminPending(next || []);
      }
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar pendientes');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const verifyAdminSubmission = async (submissionId: string, status: 'approved' | 'rejected') => {
    setIsAdminLoading(true);
    try {
      await api.verifySubmission(submissionId, { verificationStatus: status });
      toast.success(status === 'approved' ? 'Aprobado' : 'Rechazado');
      await loadAdminPending();
      await loadAdminDashboard();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo verificar');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const createAdminPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoint.name || !newPoint.address || !newPoint.city) {
      toast.error('Nombre, dirección y ciudad son obligatorios');
      return;
    }
    setIsCreatingPoint(true);
    try {
      const response = await api.createRecyclingPoint({
        name: newPoint.name.trim(),
        address: newPoint.address.trim(),
        city: newPoint.city.trim(),
        state: newPoint.state.trim() || undefined,
      });
      if (response.success) {
        toast.success('Punto de reciclaje creado');
        setNewPoint({ name: '', address: '', city: '', state: '' });
        await refreshProfile();
        await loadRecyclingPoints();
      }
    } catch (error: any) {
      toast.error(error.message || 'No se pudo crear el punto');
    } finally {
      setIsCreatingPoint(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reciclaje</h1>
        <p className="text-gray-600">
          Encuentra puntos de reciclaje y gana EcoCoins por tus entregas
        </p>
      </div>

      {!isStaff && user?.recyclingCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="w-5 h-5" />
              Tu código de reciclaje
            </CardTitle>
            <CardDescription>
              Muéstralo al operador para acreditar tus EcoCoins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-lg">{user.recyclingCode}</div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Puntos de Reciclaje</TabsTrigger>
          {!isStaff && <TabsTrigger value="submit">Registrar Entrega</TabsTrigger>}
          {!isStaff && <TabsTrigger value="history">Mis Entregas</TabsTrigger>}
          {!isStaff && <TabsTrigger value="stats">Estadísticas</TabsTrigger>}
          {showOperatorTab && <TabsTrigger value="operator">Operador</TabsTrigger>}
          {showAdminTab && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        {/* Map Tab */}
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Puntos de Reciclaje Disponibles
              </CardTitle>
              <CardDescription>
                Encuentra el punto de reciclaje más cercano
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-gray-500">
                  Cargando puntos de reciclaje...
                </p>
              ) : recyclingPoints.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  No hay puntos de reciclaje disponibles
                </p>
              ) : (
                <div className="space-y-4">
                  {recyclingPoints.map((point) => (
                    <Card key={getPointId(point)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{point.name}</CardTitle>
                            <CardDescription>
                              {point.address}, {point.city}, {point.state}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={
                              point.status === 'active' ? 'default' : 'secondary'
                            }
                          >
                            {point.status === 'active' ? 'Activo' : point.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium mb-2">
                              Materiales aceptados:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {point.acceptedMaterials.map((material, idx) => (
                                <Badge key={idx} variant="outline">
                                  {material.materialType} ({material.rewardPerKg}{' '}
                                  EC/kg)
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {!isStaff && (
                            <Button
                              onClick={() => {
                                setSelectedPoint(getPointId(point));
                                setActiveTab('submit');
                              }}
                              className="w-full"
                            >
                              Registrar entrega aquí
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submit Tab */}
        <TabsContent value="submit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Registrar Nueva Entrega
              </CardTitle>
              <CardDescription>
                Completa los detalles de tu reciclaje
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="point">Punto de Reciclaje *</Label>
                  <Select
                    value={selectedPoint}
                    onValueChange={setSelectedPoint}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un punto" />
                    </SelectTrigger>
                    <SelectContent>
                      {recyclingPoints.map((point) => (
                        <SelectItem key={getPointId(point)} value={getPointId(point)}>
                          {point.name} - {point.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Materiales a Reciclar *</Label>
                  {newSubmission.materials.map((material, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={material.materialType}
                        onValueChange={(value) =>
                          handleMaterialChange(index, 'materialType', value)
                        }
                        required
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Tipo de material" />
                        </SelectTrigger>
                        <SelectContent>
                          {getMaterialOptions().map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Peso (kg)"
                        value={material.estimatedWeight}
                        onChange={(e) =>
                          handleMaterialChange(
                            index,
                            'estimatedWeight',
                            e.target.value
                          )
                        }
                        className="w-32"
                        min="0.1"
                        step="0.1"
                        required
                      />
                      {newSubmission.materials.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveMaterial(index)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddMaterial}
                    className="w-full"
                  >
                    Agregar Material
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Información adicional sobre tu entrega..."
                    value={newSubmission.notes}
                    onChange={(e) =>
                      setNewSubmission({
                        ...newSubmission,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
              <div className="px-6 pb-6">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Registrando...' : 'Registrar Entrega'}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Historial de Entregas
              </CardTitle>
              <CardDescription>Tus reciclajes registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-gray-500">
                  Cargando entregas...
                </p>
              ) : submissions.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  No tienes entregas registradas aún
                </p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => {
                    const verificationStatus =
                      submission.verification?.status || 'pending';
                    const reward =
                      submission.rewards?.totalEcoCoins ??
                      submission.rewards?.estimatedEcoCoins ??
                      0;

                    return (
                      <Card key={submission._id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                Código: {submission.submissionCode}
                              </CardTitle>
                              <CardDescription>
                                {new Date(
                                  submission.createdAt
                                ).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(verificationStatus)}
                              <Badge
                                className={getStatusColor(verificationStatus)}
                              >
                                {getStatusLabel(verificationStatus)}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <strong>Materiales:</strong>
                              <div className="mt-1 space-y-1">
                                {submission.materials.map((material, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between text-gray-600"
                                  >
                                    <span>{material.materialType}</span>
                                    <span>
                                      {material.actualWeight ||
                                        material.estimatedWeight}{' '}
                                      kg
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-sm font-medium">
                                Recompensa:
                              </span>
                              <div className="flex items-center gap-1 text-green-600 font-semibold">
                                {reward}
                                <Recycle className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          {stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Reciclado
                    </CardTitle>
                    <Recycle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalWeight.toFixed(1)} kg
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      EcoCoins Ganados
                    </CardTitle>
                    <Award className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEcoCoins}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      CO₂ Ahorrado
                    </CardTitle>
                    <Leaf className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalCO2Saved.toFixed(1)} kg
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Impacto Ambiental</CardTitle>
                  <CardDescription>
                    Tu contribución al medio ambiente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Energía ahorrada:</span>
                      <strong>{stats.totalEnergySaved.toFixed(1)} kWh</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Agua ahorrada:</span>
                      <strong>{stats.totalWaterSaved.toFixed(1)} L</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Equivalente a plantar:</span>
                      <strong>{stats.equivalentTrees.toFixed(1)} árboles</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">
                  {isLoading
                    ? 'Cargando estadísticas...'
                    : 'No hay estadísticas disponibles'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Operator Tab */}
        <TabsContent value="operator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Registro asistido (Operador)
              </CardTitle>
              <CardDescription>
                Registra entregas usando el código/QR del usuario
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleStaffRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-point-id">Punto de Reciclaje *</Label>
                  <Select value={staffPointId} onValueChange={setStaffPointId}>
                    <SelectTrigger id="staff-point-id" aria-label="Punto de reciclaje">
                      <SelectValue placeholder="Selecciona un punto" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedOperatorPoints.map((point) => (
                        <SelectItem key={getPointId(point)} value={getPointId(point)}>
                          {point.name} - {point.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-user-recycling-code">Código del usuario *</Label>
                  <Input
                    id="staff-user-recycling-code"
                    name="userRecyclingCode"
                    value={staffUserRecyclingCode}
                    onChange={(e) => setStaffUserRecyclingCode(e.target.value)}
                    placeholder="Ej: ab12cd34..."
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="staff-material-type-0">Materiales *</Label>
                  {staffSubmission.materials.map((material, index) => (
                    <div key={index} className="flex gap-2">
                      <Label htmlFor={`staff-material-type-${index}`} className="sr-only">
                        Tipo de material
                      </Label>
                      <Select
                        value={material.materialType}
                        onValueChange={(value) =>
                          handleStaffMaterialChange(index, 'materialType', value)
                        }
                        required
                      >
                        <SelectTrigger
                          id={`staff-material-type-${index}`}
                          className="flex-1"
                          aria-label="Tipo de material"
                        >
                          <SelectValue placeholder="Tipo de material" />
                        </SelectTrigger>
                        <SelectContent>
                          {getMaterialOptionsForPoint(staffPointId).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Label htmlFor={`staff-material-weight-${index}`} className="sr-only">
                        Peso (kg)
                      </Label>
                      <Input
                        type="number"
                        id={`staff-material-weight-${index}`}
                        name={`materials[${index}].estimatedWeight`}
                        placeholder="Peso (kg)"
                        value={material.estimatedWeight}
                        onChange={(e) =>
                          handleStaffMaterialChange(index, 'estimatedWeight', e.target.value)
                        }
                        className="w-32"
                        min="0.1"
                        step="0.1"
                        required
                      />
                      {staffSubmission.materials.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleStaffRemoveMaterial(index)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={handleStaffAddMaterial} className="w-full">
                    Agregar Material
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-notes">Notas (opcional)</Label>
                  <Textarea
                    id="staff-notes"
                    name="notes"
                    value={staffSubmission.notes}
                    onChange={(e) => setStaffSubmission({ ...staffSubmission, notes: e.target.value })}
                    rows={3}
                    placeholder="Notas internas del operador..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isStaffLoading} className="flex-1">
                    {isStaffLoading ? 'Registrando...' : 'Registrar entrega'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadStaffPointStats}
                    disabled={isStaffLoading}
                    className="gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Stats
                  </Button>
                </div>

                {staffPointStats && (
                  <div className="border rounded-md p-3 text-sm">
                    <div className="font-medium mb-2">Estado de entregas (este punto)</div>
                    <div className="space-y-1">
                      {staffPointStats.length === 0 ? (
                        <div className="text-gray-500">Sin datos</div>
                      ) : (
                        staffPointStats.map((row: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-gray-700">
                            <span>{row._id}</span>
                            <span>{row.count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin" className="space-y-4">
          {allowedAdminPoints.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Crear tu primer punto de reciclaje
                </CardTitle>
                <CardDescription>
                  Aún no tienes un punto de reciclaje registrado. Crea uno para empezar a gestionar entregas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createAdminPoint} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Nombre del punto *</Label>
                      <Input
                        placeholder="Ej: Centro de reciclaje Norte"
                        value={newPoint.name}
                        onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Ciudad *</Label>
                      <Input
                        placeholder="Ej: Buenos Aires"
                        value={newPoint.city}
                        onChange={(e) => setNewPoint({ ...newPoint, city: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Dirección *</Label>
                    <Input
                      placeholder="Ej: Av. Corrientes 1234"
                      value={newPoint.address}
                      onChange={(e) => setNewPoint({ ...newPoint, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Provincia / Estado</Label>
                    <Input
                      placeholder="Ej: CABA"
                      value={newPoint.state}
                      onChange={(e) => setNewPoint({ ...newPoint, state: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isCreatingPoint}>
                    {isCreatingPoint ? 'Creando...' : 'Crear punto de reciclaje'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Administración del punto
              </CardTitle>
              <CardDescription>
                Verifica entregas y administra operadores del punto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Punto de Reciclaje *</Label>
                <Select value={adminPointId} onValueChange={setAdminPointId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un punto" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedAdminPoints.map((point) => (
                      <SelectItem key={getPointId(point)} value={getPointId(point)}>
                        {point.name} - {point.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={loadAdminDashboard} disabled={isAdminLoading} className="gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  Dashboard
                </Button>
                <Button type="button" variant="outline" onClick={loadAdminOperators} disabled={isAdminLoading}>
                  Operadores
                </Button>
                <div className="flex items-center gap-2">
                  <Select value={adminPendingStatus} onValueChange={(v) => setAdminPendingStatus(v as any)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_review">En revisión</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={loadAdminPending} disabled={isAdminLoading}>
                    Pendientes
                  </Button>
                </div>
              </div>

              {adminDashboard && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total entregas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{adminDashboard.totals.totalSubmissions}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">EcoCoins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{adminDashboard.totals.totalEcoCoins}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Kg verificados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Number(adminDashboard.totals.totalKg || 0).toFixed(1)}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Operadores
                  </CardTitle>
                  <CardDescription>
                    Crear, asignar o desasignar operadores de este punto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adminOperators.length === 0 ? (
                    <div className="text-sm text-gray-500">Sin operadores asignados</div>
                  ) : (
                    <div className="space-y-2">
                      {adminOperators.map((op) => {
                        const opId = (op.id || op._id || '').toString();
                        return (
                          <div key={opId || op.email} className="flex items-center justify-between border rounded-md p-3">
                            <div>
                              <div className="font-medium">{op.username}</div>
                              <div className="text-sm text-gray-600">{op.email}</div>
                            </div>
                            {opId && (
                              <Button type="button" variant="outline" onClick={() => removeAdminOperator(opId)}>
                                Desasignar
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <form onSubmit={createAdminOperator} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Username</Label>
                        <Input value={newOperator.username} onChange={(e) => setNewOperator({ ...newOperator, username: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <Input type="email" value={newOperator.email} onChange={(e) => setNewOperator({ ...newOperator, email: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Password</Label>
                        <Input type="password" value={newOperator.password} onChange={(e) => setNewOperator({ ...newOperator, password: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit" disabled={isAdminLoading} className="w-full">
                      {isAdminLoading ? 'Creando...' : 'Crear operador'}
                    </Button>
                  </form>

                  <form onSubmit={assignExistingAdminOperator} className="space-y-3">
                    <div className="space-y-1">
                      <Label>Asignar operador existente (email)</Label>
                      <Input
                        type="email"
                        value={assignOperatorEmail}
                        onChange={(e) => setAssignOperatorEmail(e.target.value)}
                        placeholder="operador@correo.com"
                      />
                    </div>
                    <Button type="submit" disabled={isAdminLoading} variant="outline" className="w-full">
                      {isAdminLoading ? 'Asignando...' : 'Asignar al punto'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pendientes</CardTitle>
                  <CardDescription>Entrega(s) esperando verificación</CardDescription>
                </CardHeader>
                <CardContent>
                  {adminPending.length === 0 ? (
                    <div className="text-sm text-gray-500">Sin submissions para este filtro</div>
                  ) : (
                    <div className="space-y-3">
                      {adminPending.map((s) => {
                        const userLabel = (s as any).user?.name || (s as any).user?.username || (s as any).user?.email || 'Usuario';
                        const reward = s.rewards?.estimatedEcoCoins ?? s.rewards?.totalEcoCoins ?? 0;
                        return (
                          <div key={s._id} className="border rounded-md p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{s.submissionCode}</div>
                                <div className="text-sm text-gray-600">{userLabel}</div>
                                <div className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleString()}</div>
                              </div>
                              <div className="text-sm text-green-700 font-semibold">{reward} EC</div>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                              {s.materials.map((m, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{m.materialType}</span>
                                  <span>{m.estimatedWeight} kg</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button type="button" onClick={() => verifyAdminSubmission(s._id, 'approved')} disabled={isAdminLoading} className="flex-1">
                                Aprobar
                              </Button>
                              <Button type="button" variant="outline" onClick={() => verifyAdminSubmission(s._id, 'rejected')} disabled={isAdminLoading} className="flex-1">
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
