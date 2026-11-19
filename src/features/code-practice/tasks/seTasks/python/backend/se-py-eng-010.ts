import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-010', title: 'Container Release Readiness Planner', difficulty: 'Hard', category: 'Software Engineering',
  summary: 'Assess application metadata and create a secure container release checklist without building or deploying images.',
  prompt: 'Implement `plan_release(service)`. Validate the service name, runtime, port, health-check path, and resource requests. Return a multi-stage build outline, non-root runtime requirement, pinned-dependency reminder, health check, resource bounds, and release verification steps. Report missing or unsafe settings as blockers rather than fabricating a deployable Dockerfile. This is a configuration plan only; do not invoke Docker, Kubernetes, or a cloud API.',
  tags: ['containers', 'deployment', 'supply-chain', 'secure-defaults'],
  hints: ['Separate blockers from recommendations.', 'A release plan should state what was checked and what remains unknown.', 'Never infer production credentials or deployment targets.'],
  fixtures: `{"service":{"name":"catalog-api","runtime":"python3.12","port":8080,"health_path":"/health","resources":{"cpu":"250m","memory":"256Mi"},"dependencies_pinned":true,"runs_as_root":false}}`,
  starter: `"""Create a deployment readiness plan from metadata; perform no deployment."""
REQUIRED = ("name", "runtime", "port", "health_path", "resources")

def plan_release(service):
    """Return blockers, checks, and safe build/runtime recommendations."""
    # TODO: validate required fields and flag root execution or unpinned dependencies.
    # TODO: include a health check and bounded resources only when the inputs support them.
    pass

def run_demo(): return plan_release({})
`,
  solution: `"""Create a deployment readiness plan from metadata; perform no deployment."""
REQUIRED=("name","runtime","port","health_path","resources")
def plan_release(service):
    if not isinstance(service,dict): return {"ready":False,"blockers":["service metadata must be an object"],"recommendations":[],"executed":False}
    blockers=[f"missing {key}" for key in REQUIRED if service.get(key) in (None,"")]
    if not isinstance(service.get("port"),int) or isinstance(service.get("port"),bool) or not 1 <= service.get("port",0) <= 65535: blockers.append("port must be between 1 and 65535")
    if not isinstance(service.get("resources"),dict) or not service.get("resources"): blockers.append("resource requests and limits need review")
    recommendations=["Use a multi-stage image build and copy only runtime artifacts.","Run as a dedicated non-root user.","Pin dependencies and verify image provenance."]
    if service.get("runs_as_root") is True: blockers.append("service is configured to run as root")
    if service.get("dependencies_pinned") is not True: blockers.append("dependencies are not confirmed pinned")
    checks=[]
    if isinstance(service.get("health_path"),str) and service["health_path"].startswith("/"): checks.append({"type":"health_check","path":service["health_path"],"port":service.get("port")})
    if isinstance(service.get("resources"),dict) and service["resources"]: checks.append({"type":"resource_bounds","values":service["resources"]})
    return {"service":service.get("name"),"ready":not blockers,"blockers":blockers,"recommendations":recommendations,"checks":checks,"executed":False}
def run_demo(): return plan_release({})
`,
  testCode: `from project import plan_release
good={"name":"api","runtime":"python3.12","port":8080,"health_path":"/health","resources":{"memory":"256Mi"},"dependencies_pinned":True,"runs_as_root":False}
r=plan_release(good); bad=plan_release({"name":"api","port":70000,"runs_as_root":True})
checks=[("complete settings ready",r["ready"]), ("health probe included",r["checks"][0]["path"]=="/health"), ("root flagged",any("root" in x for x in bad["blockers"])), ("invalid port blocked",any("port" in x for x in bad["blockers"])), ("no deployment performed",r["executed"] is False)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
