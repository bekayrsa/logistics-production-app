// (RS) Logistics Production App - Help System
import { useState } from 'react'
import { 
  HelpCircle, X, BookOpen, Info, 
  Lightbulb, Shield, Zap, Target,
  ChevronRight, PlayCircle, Clock, User
} from 'lucide-react'

const HELP_CONTENT = {
  '/dashboard': {
    title: 'Executive Overview',
    description: 'The mission control for your logistics operations.',
    sections: [
      {
        icon: Zap,
        title: 'Real-time KPIs',
        content: 'Monitor total tons, loads, and active trucks across all sites in real-time.'
      },
      {
        icon: Target,
        title: 'Site Filtering',
        content: 'Use the top-right filter to drill down into specific site performance or view global metrics.'
      },
      {
        icon: Info,
        title: 'Operational Briefings',
        content: 'Review critical alerts and briefings issued by managers at the bottom of the page.'
      }
    ]
  },
  '/capture': {
    title: 'Live Production Capture',
    description: 'Record daily tonnages and operational performance.',
    sections: [
      {
        icon: PlayCircle,
        title: 'Recording Loads',
        content: 'Select a Site and Truck, then enter the number of loads. Tonnage is automatically calculated based on truck capacity.'
      },
      {
        icon: Shield,
        title: 'Validation',
        content: 'Entries are saved locally as "Pending" until you review and finalize them to the cloud.'
      },
      {
        icon: Lightbulb,
        title: 'Production Failures',
        content: 'If a site is falling behind, use the "Report Failure" button to document the reason (weather, mechanical, etc.).'
      }
    ]
  },
  '/reports': {
    title: 'Intelligence & Analytics',
    description: 'In-depth analysis of historical production data.',
    sections: [
      {
        icon: BookOpen,
        title: 'Trend Analysis',
        content: 'View production graphs over time to identify bottlenecks or high-performance periods.'
      },
      {
        icon: Info,
        title: 'Briefing Resolution',
        content: 'Managers can resolve open briefings here once operational issues have been addressed.'
      }
    ]
  },
  '/users': {
    title: 'Personnel & Security',
    description: 'Manage user access and organizational roles.',
    sections: [
      {
        icon: Shield,
        title: 'Role Hierarchy',
        content: 'Admins have full control. Managers see analytics. Site Managers only see data for their assigned sites.'
      },
      {
        icon: Target,
        title: 'Site Assignments',
        content: 'Assign Site Managers to specific locations to restrict their data visibility for privacy.'
      }
    ]
  },
  '/super-admin': {
    title: 'Global Ecosystem Management',
    description: 'Top-down control for platform owners.',
    sections: [
      {
        icon: Zap,
        title: 'Tenant Onboarding',
        content: 'Create entirely new company instances and provision their primary administrators.'
      },
      {
        icon: Shield,
        title: 'Data Siloing',
        content: 'Manage the infrastructure that ensures complete isolation between different logistics companies.'
      }
    ]
  },
  '/audit-log': {
    title: 'Security & Audit Center',
    description: 'The definitive ledger for organizational accountability.',
    sections: [
      {
        icon: Shield,
        title: 'Forensic Tracking',
        content: 'Review a complete history of every tonnage adjustment and user modification.'
      },
      {
        icon: Clock,
        title: 'Timeline Analysis',
        content: 'Filter records by timestamp or operator to investigate specific operational changes.'
      },
      {
        icon: User,
        title: 'Operator Verification',
        content: 'Identify exactly which administrator performed a specific master data update.'
      }
    ]
  },
  'default': {
    title: 'System Assistance',
    description: 'General navigation and operations guide.',
    sections: [
      {
        icon: BookOpen,
        title: 'Master Data',
        content: 'Use the Infrastructure tabs to manage the foundational records: Sites, Trucks, and Mines.'
      },
      {
        icon: Lightbulb,
        title: 'Dark Mode',
        content: 'Toggle the theme in the bottom-left of the sidebar for optimal visibility in different lighting.'
      }
    ]
  }
}

function HelpSystem({ currentPath }) {
  const [isOpen, setIsOpen] = useState(false)
  const content = HELP_CONTENT[currentPath] || HELP_CONTENT['default']

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-900 text-blue-600 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 hover:scale-110 active:scale-95 transition-all group"
        title="Get Help"
      >
        <HelpCircle size={24} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Help Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] overflow-hidden">
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-500" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-100 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="p-8 pb-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                  <Lightbulb size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{content.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {content.description}
                </p>
              </div>

              <div className="space-y-6">
                {content.sections.map((section, idx) => {
                  const Icon = section.icon
                  return (
                    <div 
                      key={idx}
                      className="group p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Icon size={18} />
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">{section.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-loose pl-14">
                        {section.content}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
                 <div className="relative z-10">
                   <h5 className="text-lg font-black tracking-tight mb-2">Need more support?</h5>
                   <p className="text-sm text-blue-100 font-medium mb-6">Our technical team is available for deep-dive training sessions.</p>
                   <button className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all">
                     Contact Support <ChevronRight size={14} />
                   </button>
                 </div>
                 <HelpCircle size={120} className="absolute -bottom-10 -right-10 text-white/10 -rotate-12" />
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-50 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Mining Sense Logistics v4.0</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default HelpSystem
