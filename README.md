# Publish and Share

Publish and Share is a platform to support the implementation of tasks related to land administration systems. The platform allows for operating, integrating and disseminating land administration workflows and functionalities with a focus on base data capturing.

Publish and Share is developed as part of the [its4land](https://its4land.com/ "its4land") project. A general introduction to Publish and Share can be obtained at the [official portal](https://platform.its4land.com/portal/ "official portal").

This repository is aimed at developers wanting to adapt and use Publish and Share. The directories in the repository cover the different components of the platform:

-  *publicapi/* - This directory contains the core NodeJS implementation of the platform's OpenAPI 2.0 specification
- *processapi/* - This directory implements the internally used API for managing tool processes and Docker containers in the platform (in NodeJS)
- *db_setup/* - This directory contains SQL scripts to initialize and load sample data for a PostgreSQL database used by the platform

## License

All source code is published under the MIT License
