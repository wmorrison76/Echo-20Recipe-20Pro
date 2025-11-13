import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Plus, Search, Users, Zap } from "lucide-react";
import { format } from "date-fns";

interface RDLabProject {
  id: string;
  name: string;
  specialization: "culinary" | "pastry" | "both";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  owner: string;
  collaborators: Array<{ id: string; name: string }>;
  experimentCount: number;
  description?: string;
  vision?: string;
  lastAccessedBy?: string;
  lastAccessedAt?: string;
}

interface ProjectDashboardProps {
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  recentProjects?: RDLabProject[];
  allProjects?: RDLabProject[];
}

const DEMO_PROJECTS: RDLabProject[] = [
  {
    id: "proj-001",
    name: "Preloaded Lab",
    specialization: "both",
    createdAt: "2024-01-15",
    updatedAt: "2h ago",
    createdBy: "System",
    owner: "Your Team",
    collaborators: [
      { id: "user-1", name: "A. Vega" },
      { id: "user-2", name: "M. Ruiz" },
    ],
    experimentCount: 3,
    description: "Main experimental kitchen environment",
    vision:
      "Preserve the seeded experimentation environment with its original texture, flavor, and future-of-food scaffolding.",
    lastAccessedBy: "You",
    lastAccessedAt: "2h ago",
  },
  {
    id: "proj-002",
    name: "Pastry Spring Collection",
    specialization: "pastry",
    createdAt: "2024-02-01",
    updatedAt: "3 days ago",
    createdBy: "C. Dufour",
    owner: "Pastry Team",
    collaborators: [
      { id: "user-3", name: "C. Dufour" },
      { id: "user-4", name: "L. Singh" },
    ],
    experimentCount: 12,
    description: "Texture and flavor development for spring menu",
    vision:
      "Create delicate pastry expressions using fermented dairy and floral aromatics",
    lastAccessedBy: "C. Dufour",
    lastAccessedAt: "3 days ago",
  },
  {
    id: "proj-003",
    name: "Seafood & Shellfish Innovation",
    specialization: "culinary",
    createdAt: "2024-01-20",
    updatedAt: "5 days ago",
    createdBy: "C. Nguyen",
    owner: "R&D Team",
    collaborators: [{ id: "user-5", name: "C. Nguyen" }],
    experimentCount: 8,
    description: "Exploring emulsions and texture profiles with local seafood",
  },
];

export function ProjectDashboard({
  onSelectProject,
  onCreateProject,
  recentProjects = DEMO_PROJECTS.slice(0, 2),
  allProjects = DEMO_PROJECTS,
}: ProjectDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProjects, setFilteredProjects] = useState(allProjects);
  const [specializationFilter, setSpecializationFilter] = useState<
    "all" | "culinary" | "pastry" | "both"
  >("all");

  useEffect(() => {
    let filtered = allProjects;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.createdBy.toLowerCase().includes(query) ||
          p.collaborators.some((c) => c.name.toLowerCase().includes(query)),
      );
    }

    if (specializationFilter !== "all") {
      filtered = filtered.filter(
        (p) =>
          p.specialization === specializationFilter ||
          p.specialization === "both",
      );
    }

    setFilteredProjects(filtered);
  }, [searchQuery, specializationFilter, allProjects]);

  return (
    <div className="min-h-screen space-y-8 bg-gradient-to-br from-[#050a15] via-[#0a1929] to-[#050a15] p-6 text-cyan-100">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-cyan-100">R&D Lab Dashboard</h1>
        <p className="text-cyan-200/70">
          Manage your recipe development projects with collaborative teams
        </p>
      </div>

      {/* Recent Projects */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-cyan-100">Recent Projects</h2>
            <p className="text-sm text-cyan-200/70">
              Projects you've worked on recently
            </p>
          </div>
          <Button onClick={onCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {recentProjects.length === 0 ? (
            <Card className="col-span-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No recent projects</p>
                <Button
                  onClick={onCreateProject}
                  variant="outline"
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onSelectProject(project.id)}
                isRecent={true}
              />
            ))
          )}
        </div>
      </section>

      {/* All Projects */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-cyan-100">All Projects</h2>
          <p className="text-sm text-cyan-200/70">
            Browse and search all your projects
          </p>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/50" />
            <Input
              placeholder="Search projects by name, description, or team member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-cyan-500/20 bg-slate-950/70 pl-9 text-cyan-100 placeholder:text-cyan-300/40 focus:border-cyan-400"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={specializationFilter === "all" ? "default" : "outline"}
              onClick={() => setSpecializationFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={
                specializationFilter === "culinary" ? "default" : "outline"
              }
              onClick={() => setSpecializationFilter("culinary")}
              size="sm"
            >
              Culinary
            </Button>
            <Button
              variant={
                specializationFilter === "pastry" ? "default" : "outline"
              }
              onClick={() => setSpecializationFilter("pastry")}
              size="sm"
            >
              Pastry
            </Button>
            <Button
              variant={specializationFilter === "both" ? "default" : "outline"}
              onClick={() => setSpecializationFilter("both")}
              size="sm"
            >
              Both
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4">
          {filteredProjects.length === 0 ? (
            <Card className="border-dashed border-cyan-500/20 bg-slate-950/30">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-3 h-12 w-12 text-cyan-400/40" />
                <p className="text-cyan-300/70">
                  No projects found matching your search
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => onSelectProject(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface ProjectCardProps {
  project: RDLabProject;
  onClick: () => void;
  isRecent?: boolean;
}

function ProjectCard({ project, onClick, isRecent }: ProjectCardProps) {
  return (
    <Card
      className={`cursor-pointer border-cyan-500/30 bg-slate-950/50 backdrop-blur-sm transition hover:border-cyan-500/50 hover:bg-slate-950/70 hover:shadow-lg dark:hover:shadow-cyan-500/20 ${
        isRecent ? "border-cyan-400/60 dark:border-cyan-500/60 bg-slate-950/80" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg text-cyan-100">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="line-clamp-2 text-cyan-300/70">
                {project.description}
              </CardDescription>
            )}
          </div>
          <Badge
            className={
              project.specialization === "pastry"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900"
                : project.specialization === "culinary"
                  ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-900"
            }
          >
            {project.specialization === "both"
              ? "Culinary + Pastry"
              : project.specialization}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Experiments</p>
            <p className="font-semibold">{project.experimentCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Team Members</p>
            <p className="font-semibold">{project.collaborators.length + 1}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Updated</p>
            <p className="font-semibold text-xs">{project.updatedAt}</p>
          </div>
        </div>

        {/* Collaborators */}
        {project.collaborators.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Team
            </p>
            <div className="flex flex-wrap gap-1">
              {project.collaborators.slice(0, 3).map((collab) => (
                <Badge key={collab.id} variant="secondary" className="text-xs">
                  {collab.name}
                </Badge>
              ))}
              {project.collaborators.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{project.collaborators.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="border-t pt-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>
              Created {format(new Date(project.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          {project.lastAccessedAt && (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Last accessed {project.lastAccessedAt}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
