<%@ page pageEncoding="UTF-8"%>

<c:choose>
    <c:when test='<%= request.getParameter("noheader") == null %>'>
    <script type="text/javascript" src="/static/js/header.js"></script>
    <div id="go_head">
        <!-- see http://stackoverflow.com/questions/1037839/how-to-force-link-from-iframe-to-be-opened-in-the-parent-window -->
        <iframe src="/static/?lang=<%= lang %>" style="width:100%;height:@shared.header.height@px;border:none;overflow:none;" scrolling="no" frameborder="0" onload="_headerOnLoad(this)"></iframe>
    </div>
    </c:when>
</c:choose>