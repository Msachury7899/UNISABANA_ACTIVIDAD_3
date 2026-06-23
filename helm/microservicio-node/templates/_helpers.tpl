{{- define "microservicio-node.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{- define "microservicio-node.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "microservicio-node.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "microservicio-node.labels" -}}
app.kubernetes.io/name: {{ include "microservicio-node.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}
