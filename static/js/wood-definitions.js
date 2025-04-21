// Wood material definitions
const woodMaterials = {
    mdf: {
        title: "MDF (Medium Density Fiberboard)",
        description: "A high-grade, composite wood product made from wood fibers, glued under high temperature and pressure.",
        features: [
            "Smooth, flat surface ideal for painting and laminating",
            "Consistent density throughout the board",
            "Excellent machinability for detailed work",
            "No grain pattern, reducing waste in cutting"
        ],
        priceRange: "Moderate (₹30-40 per sq ft)",
        durabilityRating: 4,
        moistureResistance: "Low to Moderate",
        recommendedUses: ["Interior furniture", "Cabinets", "Decorative panels", "Wall units"],
        note: "Perfect for furniture, cabinetry, and interior design applications"
    },
    particleBoard: {
        title: "Particle Board",
        description: "An engineered wood product manufactured from wood particles, chips, and sawmill shavings, bonded with synthetic resin.",
        features: [
            "Cost-effective solution for furniture",
            "Uniform density and stability",
            "Good screw-holding capacity",
            "Environmentally friendly - uses recycled wood materials"
        ],
        priceRange: "Economic (₹25-35 per sq ft)",
        durabilityRating: 3,
        moistureResistance: "Low",
        recommendedUses: ["Budget furniture", "Shelving", "Office furniture", "Temporary installations"],
        note: "Ideal for interior furniture and non-structural applications"
    },
    hdhmr: {
        title: "HDHMR (High Density High Moisture Resistant)",
        description: "Advanced engineered wood with enhanced density and moisture resistance properties.",
        features: [
            "Superior moisture resistance",
            "High density for better strength",
            "Excellent screw holding capacity",
            "Suitable for high humidity areas"
        ],
        priceRange: "Premium (₹45-60 per sq ft)",
        durabilityRating: 5,
        moistureResistance: "High",
        recommendedUses: ["Kitchen cabinets", "Bathroom furniture", "Laboratory furniture", "Commercial installations"],
        note: "Recommended for kitchen cabinets and bathroom furniture"
    },
    boilo: {
        title: "BOILO",
        description: "A specialized wood product designed for exterior and high-moisture applications.",
        features: [
            "100% boiling water resistant",
            "Weather-proof properties",
            "High structural stability",
            "Long-lasting durability"
        ],
        priceRange: "Premium Plus (₹55-70 per sq ft)",
        durabilityRating: 5,
        moistureResistance: "Very High",
        recommendedUses: ["Exterior furniture", "Marine applications", "Outdoor installations", "Industrial use"],
        note: "Perfect for exterior applications and wet areas"
    }
};

// Function to generate HTML for wood material
function generateWoodMaterialHTML(material) {
    return `
        <div class="wood-material">
            <div class="wood-material-title">${material.title}</div>
            <div class="wood-material-description">${material.description}</div>
            <ul class="wood-material-features">
                ${material.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            <div class="wood-material-specs">
                <div class="spec-item"><strong>Price Range:</strong> ${material.priceRange}</div>
                <div class="spec-item"><strong>Durability:</strong> ${"★".repeat(material.durabilityRating)}${"☆".repeat(5-material.durabilityRating)}</div>
                <div class="spec-item"><strong>Moisture Resistance:</strong> ${material.moistureResistance}</div>
                <div class="spec-item"><strong>Recommended Uses:</strong></div>
                <ul class="recommended-uses">
                    ${material.recommendedUses.map(use => `<li>${use}</li>`).join('')}
                </ul>
            </div>
            <div class="wood-material-note">${material.note}</div>
        </div>
    `;
}

// Function to extract material names from query
function extractMaterialNames(query) {
    const materials = [];
    const materialAliases = {
        'mdf': ['mdf', 'medium density', 'medium density fiberboard', 'medium-density'],
        'particleboard': ['particleboard', 'particle board', 'particle wood', 'chipboard'],
        'hdhmr': ['hdhmr', 'high density', 'moisture resistant', 'action tesa', 'tesa'],
        'boilo': ['boilo', 'boiling water resistant', 'water resistant', 'waterproof board']
    };
    const queryLower = query.toLowerCase();
    
    Object.entries(materialAliases).forEach(([key, aliases]) => {
        if (aliases.some(alias => queryLower.includes(alias))) {
            materials.push(key === 'particleboard' ? 'particleBoard' : key);
        }
    });
    
    return materials;
}

// Function to get formatted wood material response
function getWoodMaterialResponse(query) {
    // Extract requested materials from the query
    const requestedMaterials = extractMaterialNames(query);
    
    // If no specific materials found or not a comparison query
    if (requestedMaterials.length === 0 || !query.toLowerCase().includes('compare')) {
        return null;
    }
    
    const container = document.createElement('div');
    container.className = 'wood-comparison';
    container.innerHTML = `
        <div class="comparison-grid">
            ${requestedMaterials
                .map(materialKey => woodMaterials[materialKey])
                .filter(material => material) // Filter out any undefined materials
                .map(material => generateWoodMaterialHTML(material))
                .join('')}
        </div>
    `;
    return container.outerHTML;
}

// Export for use in other files
window.woodMaterials = woodMaterials;
window.getWoodMaterialResponse = getWoodMaterialResponse;