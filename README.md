# Stanford Linguistics Suite

[![Stanford Linguistics](https://img.shields.io/badge/Stanford-Linguistics-8C1515.svg)](https://linguistics.stanford.edu/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive suite of computational linguistics tools developed by the Stanford University Linguistics Department for research and education in phonology, metrics, and prosody.

<p align="center">
  <img src="cogeto-client/src/assets/images/brandbar-stanford-logo@2x.png" alt="Stanford Linguistics" width="400"/>
</p>

## Contents

- [Overview](#overview)
- [Applications](#applications)
  - [MetricalTree](#metricaltree)
  - [CoGeTo](#cogeto)
- [Research Context](#research-context)
- [Technical Architecture](#technical-architecture)
- [Installation](#installation)
  - [WSL2 Setup](#wsl2-setup)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Citation](#citation)
- [Acknowledgments](#acknowledgments)

## Overview

The Stanford Linguistics Suite addresses the need for specialized computational tools in linguistic research and education. It digitizes and automates complex linguistic analysis processes, making advanced research more accessible and shareable among linguistics scholars worldwide.

The suite consists of two primary applications that share a common infrastructure but address different areas of linguistic analysis:

## Applications

### MetricalTree

MetricalTree visualizes and analyzes metrical structures in linguistics. It processes text to identify syllables, stress patterns, and metrical feet, generating graphical representations of metrical structures.

**Key Features:**
- Text processing for syllable and stress pattern identification
- Interactive visualization of metrical trees
- Integration with Stanford Parser for syntactic analysis
- Utilizes CMU Pronouncing Dictionary for syllable information
- Export and sharing capabilities

<details>
<summary><strong>Example MetricalTree Output</strong> (click to expand)</summary>
<br>
<em>Screenshot placeholder - MetricalTree visualization example</em>
</details>

### CoGeTo

CoGeTo (Constraint Generator Tool) analyzes and computes typological ordering of linguistic constraints (T-orders) in constraint-based phonology. This tool is essential for researchers working in Optimality Theory and related constraint-based frameworks.

**Key Features:**
- Computation of T-orders from constraint definitions
- Analysis of constraint interactions
- Results management and visualization
- Customizable configuration for different analysis requirements

<details>
<summary><strong>Example CoGeTo Output</strong> (click to expand)</summary>
<br>
<em>Screenshot placeholder - CoGeTo results visualization</em>
</details>

## Research Context

These tools support research in several areas of linguistics:

- **Metrical Phonology**: Study of stress patterns and rhythmic structures in language
- **Constraint-Based Phonology**: Frameworks such as Optimality Theory that analyze phonological patterns through constraint interactions
- **Computational Linguistics**: Application of computational methods to linguistic analysis
- **Typological Studies**: Cross-linguistic comparison of structural patterns

## Technical Architecture

The Stanford Linguistics Suite employs a microservices architecture:

```
Frontend Clients (React) ↔ Flask API ↔ Celery Task Queue ↔ Processing Engines
```

- **Frontend**: React applications with modern state management (Redux, Recoil)
- **API**: Python Flask RESTful and GraphQL endpoints
- **Task Queue**: Celery for handling computationally intensive operations
- **Processing Engines**: Specialized linguistic analysis modules
- **Infrastructure**: Docker containerization for consistent deployment
- **Environment Configuration**: Production vs. development modes with appropriate URL schema handling

## Installation

### Prerequisites

- Docker and Docker Compose
- 4GB+ RAM recommended for running the full stack
- Git

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/stanford-linguistics/stanford-linguistics-suite
   cd stanford-linguistics-suite
   ```

2. **Configure local host mapping:**  
   Add these entries to your hosts file:
   ```text
   127.0.0.1 api.local
   127.0.0.1 monitor.local
   127.0.0.1 cogeto.local
   127.0.0.1 metricaltree.local
   ```
   
   Location of hosts file:
   - Linux/Unix: `/etc/hosts`
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - macOS: `/private/etc/hosts`

3. **Build and launch the application:**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the applications:**
   - MetricalTree: http://metricaltree.local
   - CoGeTo: http://cogeto.local
   - API Monitor: http://monitor.local:5555 (Flower monitoring for Celery)
   - API Endpoints: http://api.local:5001

### WSL2 Setup

If you're using Windows Subsystem for Linux 2 (WSL2), there are a few additional configuration steps required:

1. **Install Prerequisites in WSL2:**
   ```bash
   # Update package listings
   sudo apt update

   # Install Docker and related tools if not already installed
   sudo apt install -y docker-compose

   ```

2. **Host Mapping for WSL2:**
   Since WSL2 uses a virtualized network interface, you need to use the WSL2 IP address instead of 127.0.0.1:
   
   ```bash
   # Get your WSL2 IP address
   export WSL_IP=$(ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
   echo $WSL_IP
   ```
   
   Then add these entries to your **Windows** hosts file (C:\Windows\System32\drivers\etc\hosts):
   ```
   YOUR_WSL_IP api.local
   YOUR_WSL_IP monitor.local
   YOUR_WSL_IP cogeto.local
   YOUR_WSL_IP metricaltree.local
   ```
   
   Note: You do NOT need to modify the hosts file in your WSL2 environment.

3. **Stanford Parser Setup:**
   If you encounter Git LFS issues with the Stanford Parser files:
   ```bash
   # Skip LFS downloads during checkout
   GIT_LFS_SKIP_SMUDGE=1 git checkout -f
   
   # Manually download and install Stanford Parser
   mkdir -p celery-queue/metrical-tree/stanford-library/
   wget https://nlp.stanford.edu/software/stanford-parser-full-2015-04-20.zip -P /tmp/
   unzip /tmp/stanford-parser-full-2015-04-20.zip -d celery-queue/metrical-tree/stanford-library/
   ```

4. **Launch with Docker Compose:**
   ```bash
   # For development, use the local configuration
   docker-compose -f docker-compose.local.yml up -d
   ```

5. **Troubleshooting WSL2 Connectivity:**
   - If you encounter 503 errors, ensure your Windows hosts file is using the correct WSL2 IP
   - Your WSL2 IP may change after system reboots; update the hosts file if needed
   - Verify container status: `docker-compose -f docker-compose.local.yml ps`
   - Check container logs: `docker-compose -f docker-compose.local.yml logs -f nginx-proxy`
   - For HTTPS-related issues, ensure `API_ENVIRONMENT` is set correctly in your docker-compose files

## Usage

### Sample Data

The repository includes sample input files for testing:
- MetricalTree: `/metrical-tree-sample-inputs`
- CoGeTo: `/cogeto-sample-inputs`

### Basic Workflow

#### MetricalTree
1. Navigate to http://metricaltree.local
2. Enter a sentence in the input field or upload a text file
3. Configure optional parameters if needed
4. Click "Generate Tree" to process the input
5. View and interact with the generated metrical tree
6. Export or save your results

#### CoGeTo
1. Navigate to http://cogeto.local
2. Upload a constraint definition file (see sample inputs for format)
3. Configure the analysis parameters
4. Click "Compute T-order" to process
5. View the results in the visualization interface
6. Export or save your analysis

## Development

### Environment Configuration

The application uses the `API_ENVIRONMENT` environment variable to determine URL schema (HTTP vs HTTPS):

- **Production mode** (`API_ENVIRONMENT=production`): Uses HTTPS for all generated URLs
- **Development mode** (`API_ENVIRONMENT=development`): Uses HTTP for all generated URLs

This setting is configured in the docker-compose files and affects how the Flask API generates external URLs, particularly for result download links.

### Monitoring and Logs

To attach to the logs of all running services:
```bash
docker-compose logs -f -t
```

To attach to the logs of a single container:
```bash
docker-compose logs -f -t <container-name>
```

### Scaling Workers

To add more workers for handling computation:
```bash
docker-compose up -d --scale worker=5 --no-recreate
```

### Local Development

For development purposes, use the local configuration:
```bash
docker-compose -f docker-compose.local.yml up
```

### Key Development Paths

- API endpoints: `api/app.py`
- Task definitions: `celery-queue/tasks.py`
- MetricalTree engine: `celery-queue/metrical-tree/`
- T-Orders engine: `celery-queue/torders/`
- MetricalTree client: `metrical-tree-client/`
- CoGeTo client: `cogeto-client/`

## Contributing

We welcome contributions to the Stanford Linguistics Suite! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Ensure code follows the existing style and architecture
- Include appropriate tests for new features
- Update documentation to reflect changes
- Follow the code of conduct (link to code of conduct file)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Citation

If you use this software in your research, please cite:

```
@software{stanford_linguistics_suite,
  author = {{Stanford Linguistics}},
  title = {Stanford Linguistics Suite: Tools for Computational Linguistic Analysis},
  url = {https://github.com/stanford-linguistics/stanford-linguistics-suite},
  year = {2025},
  institution = {Stanford University}
}
```

## Acknowledgments

- Stanford University Linguistics Department for supporting this research
- Contributors and maintainers of the Stanford Parser
- The CMU Pronouncing Dictionary team
- All researchers and students who provided feedback and testing

---

<p align="center">
  <a href="https://linguistics.stanford.edu/">Stanford Linguistics Department</a>
  •
  <a href="https://www.stanford.edu/">Stanford University</a>
</p>
