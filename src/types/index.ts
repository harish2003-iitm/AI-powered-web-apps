// Message types
export type MessageType = 'agent' | 'user' | 'system';

export interface Message {
  id: string;
  type: MessageType;
  text: string;
  timestamp: Date;
}

// Ticket and processing types
export interface Ticket {
  ticket_id: string;
  conversation: string;
  metadata?: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    [key: string]: any;
  };
}

export interface TicketSubmissionResponse {
  job_id: string;
  message: string;
}

export interface SummaryResult {
  error?: string;
  title?: string;
  summary: string;
  key_points: string[];
  action_items: string[];
  sentiment: string;
  urgency: string;
}

export interface RoutingResult {
  error?: string;
  team: string;
  department: string;
  priority: string;
  skills_required: string[];
  justification: string;
  escalation_needed: boolean;
  notes?: string;
}

export interface RecommendedSolutions {
  recommended_solutions?: string[];
  knowledge_articles?: string[];
  similar_cases?: string[];
  [key: string]: any; // Allow other properties
}

export interface RecommendationResult {
  error?: string;
  recommended_solutions: string[];
  knowledge_articles: string[];
  similar_cases: string[];
  estimated_resolution_time: string;
  confidence_score: number;
}

export interface EstimationResult {
  error?: string;
  complexity?: string;
  estimated_time: string;
  confidence_interval: string;
  bottlenecks: string[];
  optimization_suggestions: string[];
  resources_needed: string[];
  notes?: string;
}

export interface ProcessingResults {
  summary: SummaryResult;
  routing: RoutingResult;
  recommendations: string[] | RecommendedSolutions;
  estimations: EstimationResult;
  estimation?: EstimationResult; // Alternative property name
  estimated_time?: string; // Direct property that might exist
  raw_json?: any;
  final_insights?: string;
  query_info?: {
    ticket_id: string;
    submitted_at: string;
    conversation: string;
  };
}

export interface JobResult {
  ticket_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: ProcessingResults;
}

export interface JobStatusResult {
  results: JobResult[];
}

// Component prop types
export interface ChatMessageProps {
  message: Message;
}

export interface ProcessingIndicatorProps {
  visible: boolean;
  jobId?: string;
  status?: string;
}

export interface ResultPanelProps {
  results: ProcessingResults | null;
}

export interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// Data Product Designer Types
export interface UseCase {
  id: string;
  title: string;
  description: string;
  targetUsers: string[];
  businessRequirements: string[];
  dataRequirements: string[];
}

export interface TargetAttribute {
  id: string;
  name: string;
  dataType: string;
  description: string;
  isKey: boolean;
}

export interface SourceAttribute {
  id: string;
  name: string;
  dataType: string;
  description: string;
  isKey: boolean;
  sourceSystem?: string;
}

export interface AttributeMapping {
  id: string;
  targetAttributeId: string;
  sourceAttributeId: string;
  mappingType: 'direct' | 'transformation';
  transformationLogic?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  description: string;
  attributes: SourceAttribute[];
}

export interface DataProduct {
  id: string;
  name: string;
  description: string;
  targetAttributes: TargetAttribute[];
  mappings: AttributeMapping[];
  certificationStatus: 'pending' | 'approved' | 'rejected';
}

export interface DataProductDesignState {
  step: 'use-case' | 'target-design' | 'source-identification' | 'mapping' | 'certification';
  useCase: UseCase | null;
  availableSources: DataSource[];
  selectedSources: DataSource[];
  targetDataProduct: DataProduct | null;
} 