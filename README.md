# Constellapedia Web3 conversion

## Project structure (mostly the relevant parts)
```console
.
├── api                             # source for the API
│   ├── controllers                 # Reading constallations, Manipulationg nodes and edges and payments are handled here
│   ├── middlewares                 # reusable business logic
│   └── services                    # support business logic used in controller
│── app                             # the frontend server source
│   ├── constellation-defaults      # default visualization configuration for the test constellations
│   └── controllers                 # business logic
│── site                            # the frontpage source
│── src                             # the app frontend source
├── seeders                         # the seeds for the example constellations
│── index.js                        # Ecosystem entry point
```

##