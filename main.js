// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ تم تحميل الموقع بنجاح');
    
    // إضافة مستمع للبحث عند الضغط على Enter
    document.getElementById('nidInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchWFP();
        }
    });
    
    // التحقق من وجود معاملات في الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const nid = urlParams.get('nid');
    if (nid) {
        document.getElementById('nidInput').value = nid;
        setTimeout(() => searchWFP(), 500);
    }
    
    // إضافة تأثيرات حركية
    addAnimations();
});

// إضافة تأثيرات حركية
function addAnimations() {
    // تأثير ظهور تدريجي للعناصر
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    document.querySelectorAll('.feature-item, .result-section').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.5s ease';
        observer.observe(el);
    });
}

// تصدير الدوال للاستخدام العام
window.searchWFP = searchWFP;
window.downloadJSON = downloadJSON;
