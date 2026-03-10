// API WFP
const WFP_API = 'https://pal.beneficiaryregistration.cbt.wfp.org/api/v2/submission/retrieve';

// تخزين آخر نتيجة بحث
let lastResult = null;
let lastFileName = null;

// دالة البحث الرئيسية
async function searchWFP() {
    const nid = document.getElementById('nidInput').value.trim();
    
    if (!nid) {
        showToast('الرجاء إدخال رقم الهوية', 'error');
        return;
    }
    
    if (!/^\d+$/.test(nid) || nid.length < 9) {
        showToast('رقم هوية غير صالح - يجب أن يكون 9 أرقام على الأقل', 'error');
        return;
    }
    
    // إظهار شريط التقدم
    document.getElementById('progressBar').classList.remove('d-none');
    document.getElementById('searchBtn').disabled = true;
    
    try {
        // استخدام CORS proxy
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = `${WFP_API}/${nid}`;
        const encodedUrl = encodeURIComponent(targetUrl);
        
        const response = await fetch(`${proxyUrl}${encodedUrl}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // تنسيق وعرض النتائج
        displayResults(data, nid);
        
    } catch (error) {
        console.error('Search error:', error);
        
        // محاولة بديلة مع proxy آخر
        try {
            const altProxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(`${altProxy}${WFP_API}/${nid}`, {
                headers: {
                    'Origin': window.location.origin
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            displayResults(data, nid);
            
        } catch (altError) {
            console.error('Alternative search error:', altError);
            showToast('فشل الاتصال بالخادم - تأكد من اتصالك بالإنترنت', 'error');
        }
    } finally {
        // إخفاء شريط التقدم
        document.getElementById('progressBar').classList.add('d-none');
        document.getElementById('searchBtn').disabled = false;
    }
}

// دالة عرض النتائج
function displayResults(data, nid) {
    const resultData = data.data || {};
    const metadata = data.metadata || {};
    
    lastResult = data;
    lastFileName = `wfp_${nid}_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
    
    let html = `
        <div class="result-section">
            <div class="result-title">
                <i class="fas fa-check-circle text-success"></i>
                معلومات أساسية
            </div>
            <div class="result-grid">
                <div class="result-item">
                    <strong>رقم البحث</strong>
                    <span>${nid}</span>
                </div>
                <div class="result-item">
                    <strong>تاريخ البحث</strong>
                    <span>${new Date().toLocaleString('ar-SA')}</span>
                </div>
                <div class="result-item">
                    <strong>حالة الملف</strong>
                    <span class="badge-status">${data.state || 'غير معروف'}</span>
                </div>
                <div class="result-item">
                    <strong>آخر تحديث</strong>
                    <span>${resultData.beneficiaryLastTimeUpdated || 'غير متوفر'}</span>
                </div>
            </div>
        </div>
    `;
    
    // معلومات رب الأسرة
    if (resultData.hohfirstName) {
        html += `
            <div class="result-section">
                <div class="result-title">
                    <i class="fas fa-user-circle text-primary"></i>
                    رب الأسرة
                </div>
                <div class="result-grid">
                    <div class="result-item">
                        <strong>الاسم الكامل</strong>
                        <span>${resultData.hohfirstName || ''} ${resultData.hohfathersName || ''} ${resultData.hohgrandfathersName || ''} ${resultData.hohlastName || ''}</span>
                    </div>
                    <div class="result-item">
                        <strong>تاريخ الميلاد</strong>
                        <span>${resultData.hohdob || 'غير متوفر'}</span>
                    </div>
                    <div class="result-item">
                        <strong>العمر</strong>
                        <span>${resultData.hohage || 'غير متوفر'}</span>
                    </div>
                    <div class="result-item">
                        <strong>الجنس</strong>
                        <span>${resultData.hohgender === 'M' ? 'ذكر' : 'أنثى'}</span>
                    </div>
                    <div class="result-item">
                        <strong>رقم الجوال</strong>
                        <span>${resultData.primaryPhoneNumber || 'غير متوفر'}</span>
                    </div>
                    <div class="result-item">
                        <strong>الحالة الاجتماعية</strong>
                        <span>${resultData.hohmaritalStatus || 'غير متوفر'}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // معلومات الموقع
    if (resultData.admin2) {
        html += `
            <div class="result-section">
                <div class="result-title">
                    <i class="fas fa-map-marker-alt text-danger"></i>
                    معلومات الموقع
                </div>
                <div class="result-grid">
                    <div class="result-item">
                        <strong>المحافظة</strong>
                        <span>${resultData.admin2 || 'غير متوفر'}</span>
                    </div>
                    <div class="result-item">
                        <strong>المدينة</strong>
                        <span>${resultData.admin3 || 'غير متوفر'}</span>
                    </div>
                    <div class="result-item">
                        <strong>المنطقة</strong>
                        <span>${resultData.admin4 || 'غير متوفر'}</span>
                    </div>
                    <div class="result-item">
                        <strong>نوع السكن</strong>
                        <span>${resultData.adminAccomodation || 'غير متوفر'}</span>
                    </div>
                    <div class="result-item">
                        <strong>حالة النزوح</strong>
                        <span>${resultData.hhdisplacement || 'غير متوفر'}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // أفراد العائلة
    if (resultData.family_members_information && resultData.family_members_information.length > 0) {
        html += `
            <div class="result-section">
                <div class="result-title">
                    <i class="fas fa-users text-success"></i>
                    أفراد العائلة (${resultData.family_members_information.length})
                </div>
        `;
        
        resultData.family_members_information.forEach((member, index) => {
            html += `
                <div class="family-card">
                    <h6>عضو ${index + 1}</h6>
                    <div class="result-grid">
                        <div class="result-item">
                            <strong>الاسم</strong>
                            <span>${member.hhmemberfirstName || ''} ${member.hhmemberfathersName || ''} ${member.hhmemberlastName || ''}</span>
                        </div>
                        <div class="result-item">
                            <strong>رقم الهوية</strong>
                            <span>${member.hhmemberdocumentNumber || 'غير متوفر'}</span>
                        </div>
                        <div class="result-item">
                            <strong>تاريخ الميلاد</strong>
                            <span>${member.hhmemberdob || 'غير متوفر'}</span>
                        </div>
                        <div class="result-item">
                            <strong>العمر</strong>
                            <span>${member.hhmemberage || 'غير متوفر'}</span>
                        </div>
                        <div class="result-item">
                            <strong>الصلة</strong>
                            <span>${member.hhmemberrelation || 'غير متوفر'}</span>
                        </div>
                        <div class="result-item">
                            <strong>الجنس</strong>
                            <span>${member.hhmembergender === 'M' ? 'ذكر' : 'أنثى'}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    document.getElementById('resultContent').innerHTML = html;
    
    // إظهار النافذة المنبثقة
    const modal = new bootstrap.Modal(document.getElementById('resultModal'));
    modal.show();
}

// دالة تحميل JSON
function downloadJSON() {
    if (!lastResult) {
        showToast('لا توجد بيانات للتحميل', 'warning');
        return;
    }
    
    const jsonStr = JSON.stringify(lastResult, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = lastFileName || 'wfp_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('تم تحميل الملف بنجاح', 'success');
}

// دالة إظهار الإشعارات
function showToast(message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toastMessage');
    
    toastBody.textContent = message;
    
    // تغيير لون الإشعار حسب النوع
    const toastHeader = toastEl.querySelector('.toast-header');
    if (type === 'error') {
        toastHeader.style.background = '#ff4444';
        toastHeader.style.color = 'white';
    } else if (type === 'success') {
        toastHeader.style.background = '#00C851';
        toastHeader.style.color = 'white';
    } else {
        toastHeader.style.background = '#33b5e5';
        toastHeader.style.color = 'white';
    }
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}
