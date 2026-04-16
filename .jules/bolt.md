## 2024-05-15 - React Render O(N) Array Find Optimization
**Learning:** Found O(N) `array.find()` operations within React loops and render paths targeting `allProblems`, introducing CPU overhead during rapid rendering/sorting iterations on a very large problem catalog.
**Action:** Always pre-compute and rely exclusively on O(1) mappings (`problemMap` by ID and `problemTitleMap` by lowercase title) to avoid O(N*M) bottlenecks during frontend computation steps.
