# ML Service

This directory contains the machine learning recommendation engine for BlockTix, completely separated from the client application.

## Components

### `recommender.js`
Collaborative filtering recommendation system that:
- Loads and caches movie ratings data from CSV files at the repository root
- Maps movie genres to event categories
- Computes user preference statistics based on historical ratings
- Generates personalized category recommendations

### `test.js`
Test script to verify the ML service is working correctly with the CSV data.

## Data Files
The service expects `movies.csv` and `ratings.csv` to be located in the same directory as the ML service (`ml/` folder).

## Usage

### From Node.js (API Routes)
```javascript
const path = require('path');
const mlServicePath = path.resolve(process.cwd(), "..", "ml", "recommender.js");
const { 
  getRecommendedCategories, 
  getRecommendedCategoriesVerbose,
  getKnownUserIds 
} = require(mlServicePath);

// Get top 3 recommended categories for a user
const categories = await getRecommendedCategories(userId, 3);

// Get detailed statistics
const stats = await getRecommendedCategoriesVerbose(userId, 3);

// Get all available user IDs from dataset
const userIds = getKnownUserIds();
```

### Testing
Run the test script to verify everything works:
```bash
cd ml
node test.js
```

## Category Mapping

Movie genres are mapped to event categories as follows:
- **Sports**: Action, Adventure
- **Art**: Animation, Drama
- **Food And Drink**: Comedy, Romance, Children
- **Education**: Documentary, Sci-Fi, War
- **Festival**: Fantasy, Horror
- **Music**: Musical
- **Other**: Crime, Film-Noir, Mystery, Thriller, Western, IMAX

## Dataset
- **Users**: 610 unique users
- **Movies**: 9,744 movies with genre information
- **Ratings**: 100,838 ratings on a 0.5-5.0 scale
