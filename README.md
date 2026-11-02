Inspiration
While discussing what industries would benefit most from the strengths of AI- automating repetitive manual tasks - we focused on the supply chain industry. Specifically, we noticed the immense friction small companies face, exacerbated by recent tariffs. My personal experience as an intern in a small parts manufacturing company confirmed the confusion: what to order, where to order, and who to call. Research showed that procurement for small businesses is one of the most tedious and time-consuming processes. We decided to reimagine it not as a burden, but as an intelligent, automated ecosystem enriched with AI.

What it Does
Procuroid is an end-to-end procurement tool that helps businesses find supply leads and convert them into actual deals, taking care of everything in between. Utilizing the Google ADK, our Agentic AI workflow searches for suitable leads, autonomously calls them to inquire and negotiate the price, sets up meetings, and creates contracts—saving hundreds of hours of call time. Procuroid operates through a symphony of six specialized Agentic AIs working together-> SupplierScoutAgent: Finds and vets potential suppliers through our supplier database. QuotationAgent: Contacts suppliers (via email or phone) to collect price quotes automatically. OrderPlacementAgent: Confirms and places purchase orders once approved. LogisticsAgent: Coordinates delivery with third-party carriers. SchedulingAgent: Books meetings or calls with suppliers via calendar APIs. ContractAgent: Drafts legal contracts using a library of templates and LLM assistance.

How We Built It 🛠️
We created a composite workflow by connecting six distinct AI Agents using the Agent Dev Kit (ADK). A key innovation is the ParallelAgent architecture, which allows us to orchestrate multiple agents to connect with suppliers simultaneously. This dramatically speeds up the quotation process, turning what used to take days into minutes. We can quantify this speedup based on the number of parallel agents ($N_{\text{agents}}$):
 
For communication, we connected this workflow to its knowledge base using ElevenLabs and Twilio to make smart conversational calls. Our interactive front-end dashboard, which displays call info, price comparisons, and contract formation status, is hosted on GCP via Cloud Run and Cloud Build. Our client runs on Route53 at procuroid.tech, with data stored securely in Postgres.

Challenges We Ran Into 🚧
Low-latency Voice AI Integration: It was difficult to maintain smooth, real-time phone conversations using ElevenLabs while dynamically passing updated order information. Any perceived delay, $\Delta t$, breaks the illusion of a human caller. Parallel Coordination: Managing multiple AI agents operating in parallel without race conditions or data conflicts required careful orchestration and state management. Workflow Synchronization: Ensuring a smooth transition between an agent's task completion and a necessary human approval step took extensive debugging to synchronize the digital and human workflows.

Accomplishments That We're Proud Of 🏆
A visually polished, responsive system that presents complex data beautifully. The seamless integration between the voice AI, the Agent Workflow, and the beautiful representation of the collected data. An effective voice-based AI capable of discussing intricate order parameters conversationally. Designing and testing a fully autonomous multi-agent workflow from supplier scouting to order tracking.

What We Learned
We learned firsthand how to design cooperative AI agent systems that manage complex business workflows. We also discovered that building true real-time AI-human communication and parallel task management demands meticulous orchestration and data sharing protocols to create surprisingly human-like coordination.

What's Next for Procuroid 🚀
We plan to: Expand functionality to allow manufacturers to directly upload and manage their own profiles and product catalogs. Introduce more AI-driven features, such as predictive restocking and anomaly detection. Add membership-based access models (similar to Sam’s Club or Walmart+) to provide businesses with premium features like priority quoting and supplier verification. Continue improving voice and multimodal interfaces to make the entire procurement experience fully conversational and hands-free.

Built With
elevenlabs
flask
gcp
googleadk
postgresql
python
supabase
typescript

This is a read me page, please go through the whole page. Edited on: 02/11/2026
